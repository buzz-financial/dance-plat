"use client";

import { useState } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  preferredTime: string;
  experienceLevel: string;
  specialRequests: string;
}

type FormErrors = Partial<Record<keyof FormData | "submit", string>>;

type InputFieldProps = {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  maxLength?: number;
  placeholder?: string;
};

function InputField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  maxLength,
  placeholder,
}: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-2 font-semibold text-gray-700 text-sm">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={onChange}
        className={`
          px-4 py-3 rounded-xl border-2 transition-all duration-200 
          bg-white/80 backdrop-blur-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500
          hover:bg-white hover:shadow-md
          ${error ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-teal-300'}
        `}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutForm() {
  // Mock search params for demo
  const packageName = "Premium Piano Package";
  const packagePrice = "$89";

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    preferredTime: "",
    experienceLevel: "",
    specialRequests: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) =>
    value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();

  const formatExpiryDate = (value: string) =>
    value.replace(/\D/g, "").replace(/(\d{2})(\d{0,2})/, "$1/$2").trim();

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Apply formatting for specific fields
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value);
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, "");
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    const requiredFields: (keyof FormData)[] = [
      "firstName", "lastName", "email", "phone",
      "cardNumber", "expiryDate", "cvv", "cardName",
      "address", "city", "state", "zipCode"
    ];

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Invalid card number";
    }

    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = "CVV must be 3 or 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      await new Promise((res) => setTimeout(res, 2000));
      alert("Payment successful! (This is a demo)");
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Payment failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 rounded-3xl shadow-2xl text-white overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-600/90"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mr-6 shadow-lg">
              💳
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Secure Checkout
              </h1>
              <p className="text-xl text-emerald-100">
                {packageName} - {packagePrice}
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="space-y-6">
            
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">1</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                />

                <InputField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                />

                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={errors.email}
                  placeholder="your.email@example.com"
                />

                <InputField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  error={errors.phone}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">2</span>
                Payment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField
                    label="Card Number"
                    name="cardNumber"
                    value={formData.cardNumber}
                    maxLength={19}
                    onChange={handleInputChange('cardNumber')}
                    error={errors.cardNumber}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <InputField
                  label="Name on Card"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange('cardName')}
                  error={errors.cardName}
                  placeholder="John Doe"
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Expiry Date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    maxLength={5}
                    onChange={handleInputChange('expiryDate')}
                    error={errors.expiryDate}
                    placeholder="MM/YY"
                  />

                  <InputField
                    label="CVV"
                    name="cvv"
                    value={formData.cvv}
                    maxLength={4}
                    onChange={handleInputChange('cvv')}
                    error={errors.cvv}
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">3</span>
                Billing Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField
                    label="Street Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    error={errors.address}
                    placeholder="123 Main Street"
                  />
                </div>

                <InputField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  error={errors.city}
                  placeholder="New York"
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange('state')}
                    error={errors.state}
                    placeholder="NY"
                  />

                  <InputField
                    label="Zip Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange('zipCode')}
                    error={errors.zipCode}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none text-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Complete Purchase - $${(parseFloat(packagePrice.replace("$", "")) + 2.99).toFixed(2)}`
                )}
              </button>

              {errors.submit && (
                <p className="text-red-600 text-sm text-center mt-4 font-medium">
                  {errors.submit}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-gray-600">
          <p className="flex items-center justify-center text-sm">
            <span className="mr-2">🔒</span>
            Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}