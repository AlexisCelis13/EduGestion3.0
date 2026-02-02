import { Injectable } from '@angular/core';
import { loadScript } from '@paypal/paypal-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  constructor() { }

  async initPayPalButton(containerId: string, amount: number, onApprove: (details: any) => void) {
    try {
      const paypal = await loadScript({ 
        clientId: environment.paypalClientId,
        currency: environment.paypalCurrency 
      });

      if (paypal && paypal.Buttons) {
        await paypal.Buttons({
          style: {
            layout: 'vertical',
            color:  'blue',
            shape:  'rect',
            label:  'paypal'
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount.toString(),
                  currency_code: environment.paypalCurrency
                }
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            const details = await actions.order.capture();
            onApprove(details);
          },
          onError: (err: any) => {
            console.error('PayPal Error:', err);
            // Aquí podrías notificar al usuario de un error
          }
        }).render(containerId);
      }
    } catch (error) {
      console.error('Failed to load the PayPal JS SDK script', error);
    }
  }
}
