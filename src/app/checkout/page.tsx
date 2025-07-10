import { Suspense } from 'react';
import CheckoutForm from '@/components/checkoutform';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <Suspense fallback={<div className="p-8 text-center text-slate-600">Loading checkout...</div>}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
