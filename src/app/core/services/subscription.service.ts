import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// Interfaces
export interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    currency: string;
    features: string[];
    max_students: number | null;
    max_teachers: number | null;
    is_active: boolean;
    display_order: number;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'grace_period';
    billing_cycle: 'monthly';
    trial_start: string | null;
    trial_end: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancelled_at: string | null;
    grace_period_end: string | null;
    payment_provider: string | null;
    credit_balance: number;
    created_at: string;
    updated_at: string;
    // Joined data
    plan?: Plan;
}

export interface SubscriptionHistory {
    id: string;
    subscription_id: string;
    event_type: string;
    from_plan: string | null;
    to_plan: string | null;
    amount: number | null;
    notes: string | null;
    created_at: string;
}

export interface SubscriptionWithPlan extends Subscription {
    plan: Plan;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseAnonKey
        );
    }

    // =====================================================
    // PLANS
    // =====================================================

    async getPlans(): Promise<Plan[]> {
        const { data, error } = await this.supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) throw error;
        return data || [];
    }

    async getPlanById(planId: string): Promise<Plan | null> {
        const { data, error } = await this.supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (error) return null;
        return data;
    }

    // =====================================================
    // SUBSCRIPTIONS
    // =====================================================

    async getSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
        const { data, error } = await this.supabase
            .from('subscriptions')
            .select(`
        *,
        plan:plans(*)
      `)
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data as SubscriptionWithPlan;
    }

    async createSubscription(
        userId: string,
        planId: string,
        startTrial: boolean = true
    ): Promise<Subscription> {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

        const subscriptionData: any = {
            user_id: userId,
            plan_id: planId,
            status: startTrial ? 'trial' : 'active',
            billing_cycle: 'monthly',
            payment_provider: 'simulated',
            trial_start: startTrial ? now.toISOString() : null,
            trial_end: startTrial ? trialEnd.toISOString() : null,
            current_period_start: startTrial ? null : now.toISOString(),
            current_period_end: startTrial ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data, error } = await this.supabase
            .from('subscriptions')
            .insert(subscriptionData)
            .select()
            .single();

        if (error) throw error;

        // Register in history
        await this.addHistoryEvent(data.id, 'created', null, planId, null, 'Nueva suscripción creada');

        if (startTrial) {
            await this.addHistoryEvent(data.id, 'trial_started', null, planId, null, 'Período de prueba iniciado (14 días)');
        }

        return data;
    }

    async activateSubscription(subscriptionId: string): Promise<Subscription> {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const { data, error } = await this.supabase
            .from('subscriptions')
            .update({
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        await this.addHistoryEvent(subscriptionId, 'payment_success', null, data.plan_id);

        return data;
    }

    async upgradePlan(subscriptionId: string, newPlanId: string): Promise<Subscription> {
        // Get current subscription
        const { data: current } = await this.supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('id', subscriptionId)
            .single();

        if (!current) throw new Error('Subscription not found');

        const now = new Date();
        const isInTrial = current.status === 'trial';

        // If in trial, just change the plan without changing status or dates
        // If active, calculate proration and update period
        let updateData: any = {
            plan_id: newPlanId,
            updated_at: now.toISOString()
        };

        if (!isInTrial) {
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const proration = await this.calculateProration(current, newPlanId);

            updateData = {
                ...updateData,
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                credit_balance: (current.credit_balance || 0) + proration.credit
            };
        }

        const { data, error } = await this.supabase
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        const noteText = isInTrial
            ? `Cambio de plan durante trial: de ${current.plan?.name} a ${newPlanId}`
            : `Upgrade de ${current.plan?.name} a ${newPlanId}`;

        await this.addHistoryEvent(
            subscriptionId,
            'upgraded',
            current.plan_id,
            newPlanId,
            isInTrial ? 0 : undefined,
            noteText
        );

        return data;
    }

    async downgradePlan(subscriptionId: string, newPlanId: string): Promise<Subscription> {
        // Get current subscription
        const { data: current } = await this.supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('id', subscriptionId)
            .single();

        if (!current) throw new Error('Subscription not found');

        // Downgrade takes effect at end of current period
        // For now, we update immediately but note the change
        const proration = await this.calculateProration(current, newPlanId);

        const { data, error } = await this.supabase
            .from('subscriptions')
            .update({
                plan_id: newPlanId,
                credit_balance: (current.credit_balance || 0) + proration.credit,
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        await this.addHistoryEvent(
            subscriptionId,
            'downgraded',
            current.plan_id,
            newPlanId,
            0,
            `Downgrade de ${current.plan?.name} a ${newPlanId}. Crédito aplicado: $${proration.credit}`
        );

        return data;
    }

    async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
        const now = new Date();

        const { data, error } = await this.supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: now.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        await this.addHistoryEvent(
            subscriptionId,
            'cancelled',
            data.plan_id,
            null,
            null,
            reason || 'Suscripción cancelada por el usuario'
        );

        return data;
    }

    async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const { data: current } = await this.supabase
            .from('subscriptions')
            .select('*')
            .eq('id', subscriptionId)
            .single();

        if (!current) throw new Error('Subscription not found');

        const { data, error } = await this.supabase
            .from('subscriptions')
            .update({
                status: 'active',
                cancelled_at: null,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        await this.addHistoryEvent(subscriptionId, 'reactivated', null, data.plan_id, null, 'Suscripción reactivada');

        return data;
    }

    // =====================================================
    // PRORATION CALCULATION
    // =====================================================

    async calculateProration(
        currentSubscription: SubscriptionWithPlan | any,
        newPlanId: string
    ): Promise<{ credit: number; amountToPay: number; daysRemaining: number }> {
        const newPlan = await this.getPlanById(newPlanId);
        if (!newPlan) throw new Error('New plan not found');

        const currentPlan = currentSubscription.plan;
        if (!currentPlan) {
            return { credit: 0, amountToPay: newPlan.price_monthly, daysRemaining: 0 };
        }

        // Calculate days remaining in current period
        const now = new Date();
        const periodEnd = currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end)
            : now;

        const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRateCurrent = currentPlan.price_monthly / 30;
        const dailyRateNew = newPlan.price_monthly / 30;

        // Calculate credit from unused time
        const credit = Math.round(dailyRateCurrent * daysRemaining);

        // Calculate amount to pay for remaining time at new rate
        const newCost = Math.round(dailyRateNew * daysRemaining);
        const amountToPay = Math.max(0, newCost - credit);

        return { credit, amountToPay, daysRemaining };
    }

    // =====================================================
    // SUBSCRIPTION HISTORY
    // =====================================================

    async getSubscriptionHistory(subscriptionId: string): Promise<SubscriptionHistory[]> {
        const { data, error } = await this.supabase
            .from('subscription_history')
            .select('*')
            .eq('subscription_id', subscriptionId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    private async addHistoryEvent(
        subscriptionId: string,
        eventType: string,
        fromPlan?: string | null,
        toPlan?: string | null,
        amount?: number | null,
        notes?: string
    ): Promise<void> {
        await this.supabase
            .from('subscription_history')
            .insert({
                subscription_id: subscriptionId,
                event_type: eventType,
                from_plan: fromPlan,
                to_plan: toPlan,
                amount: amount,
                notes: notes
            });
    }

    // =====================================================
    // PAYMENT SIMULATION
    // =====================================================

    async simulatePayment(amount: number): Promise<{ success: boolean; transactionId: string }> {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Always succeed in simulation mode
        return {
            success: true,
            transactionId: `SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };
    }

    // =====================================================
    // ACCESS CONTROL HELPERS
    // =====================================================

    isSubscriptionActive(subscription: Subscription | null): boolean {
        if (!subscription) return false;
        return ['trial', 'active'].includes(subscription.status);
    }

    isInGracePeriod(subscription: Subscription | null): boolean {
        if (!subscription) return false;
        return subscription.status === 'grace_period';
    }

    canCreateNewAppointments(subscription: Subscription | null): boolean {
        // Only active or trial subscriptions can create new appointments
        return this.isSubscriptionActive(subscription);
    }

    canEditLandingPage(subscription: Subscription | null): boolean {
        return this.isSubscriptionActive(subscription);
    }

    canEditStudents(subscription: Subscription | null): boolean {
        return this.isSubscriptionActive(subscription);
    }

    canManageExistingAppointments(subscription: Subscription | null): boolean {
        // Can manage existing appointments even in grace period
        return this.isSubscriptionActive(subscription) || this.isInGracePeriod(subscription);
    }

    getDaysUntilExpiration(subscription: Subscription | null): number | null {
        if (!subscription) return null;

        const endDate = subscription.current_period_end || subscription.trial_end;
        if (!endDate) return null;

        const now = new Date();
        const end = new Date(endDate);
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    getTrialDaysRemaining(subscription: Subscription | null): number | null {
        if (!subscription || subscription.status !== 'trial') return null;
        if (!subscription.trial_end) return null;

        const now = new Date();
        const trialEnd = new Date(subscription.trial_end);
        return Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
}
