'use client';
import { useState } from 'react';
import { useCompleteProfileMutation } from '@/store/api';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';

const STEPS = [
  { id: 1, title: 'Personal & Contact', icon: 'user' },
  { id: 2, title: 'Identity & Bike', icon: 'id-card' },
  { id: 3, title: 'Medical & Consent', icon: 'check-circle' },
];

export default function IndividualProfileForm({ registration }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completeProfile, { isLoading }] = useCompleteProfileMutation();
  
  const [formData, setFormData] = useState({
    // Basic Details
    name: registration.name || '',
    nickname: registration.nickname || '',
    dateOfBirth: registration.dateOfBirth || '',
    age: registration.age || '',
    gender: registration.gender || '',
    bloodGroup: registration.bloodGroup || '',
    phone: registration.phone || '',
    whatsappNumber: registration.whatsappNumber || '',
    email: registration.email || '',
    city: registration.city || '',
    state: registration.state || '',
    address: registration.address || '',
    pincode: registration.pincode || '',
    instagramProfile: registration.instagramProfile || '',
    youtubeChannel: registration.youtubeChannel || '',
    
    // Identity
    governmentIdProof: registration.governmentIdProof || '',
    riderPhoto: registration.riderPhoto || '',
    
    // Motorcycle
    motorcycleBrand: registration.motorcycleBrand || '',
    motorcycleModel: registration.motorcycleModel || '',
    engineCC: registration.engineCC || '',
    registrationNumber: registration.registrationNumber || '',
    bikeDetails: registration.bikeDetails || '',
    experienceLevel: registration.experienceLevel || '',
    
    // Riding Info
    previousOffRoadEvents: registration.previousOffRoadEvents || false,
    previousEventsDetails: registration.previousEventsDetails || '',
    ridingClubName: registration.ridingClubName || '',
    emergencyContact: registration.emergencyContact || '',
    emergencyContactNumber: registration.emergencyContactNumber || '',
    
    // Medical
    medicalConditions: registration.medicalConditions || '',
    allergies: registration.allergies || '',
    physicallyFit: registration.physicallyFit || false,
    hasHelmet: registration.hasHelmet || false,
    hasRidingJacket: registration.hasRidingJacket || false,
    hasGloves: registration.hasGloves || false,
    hasKneeGuards: registration.hasKneeGuards || false,
    hasRidingBoots: registration.hasRidingBoots || false,
    hasHydrationPack: registration.hasHydrationPack || false,
    
    // Consent
    agreeToRules: registration.agreeToRules || false,
    understandsRisk: registration.understandsRisk || false,
    acceptsLiability: registration.acceptsLiability || false,
    allowsMediaUsage: registration.allowsMediaUsage || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: // Personal & Contact
        return !!(
          formData.name &&
          formData.email &&
          formData.phone &&
          formData.age &&
          formData.gender &&
          formData.bloodGroup &&
          formData.whatsappNumber &&
          formData.city &&
          formData.state &&
          formData.address &&
          formData.pincode &&
          formData.emergencyContact &&
          formData.emergencyContactNumber
        );
      
      case 2: // Identity & Bike
        return !!(
          formData.governmentIdProof &&
          formData.riderPhoto &&
          formData.motorcycleBrand &&
          formData.motorcycleModel &&
          formData.engineCC &&
          formData.registrationNumber &&
          formData.experienceLevel
        );
      
      case 3: // Medical & Consent
        return !!(
          formData.physicallyFit &&
          formData.agreeToRules &&
          formData.understandsRisk &&
          formData.acceptsLiability &&
          formData.allowsMediaUsage
        );
      
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
    } else {
      alert(`Please fill all required fields in Step ${currentStep}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        alert(`Please complete all required fields in Step ${step}`);
        setCurrentStep(step);
        return;
      }
    }
    
    try {
      await completeProfile({ id: registration._id, ...formData }).unwrap();
      alert('Profile completed successfully!');
      router.push(`/booking/${registration.ticketId}`);
    } catch (error) {
      alert('Failed to save profile: ' + (error.data?.message || error.message));
    }
  };

  return (
    <div className="card p-6">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  validateStep(step.id) 
                    ? 'bg-green-500 text-white'
                    : currentStep >= step.id 
                    ? 'bg-terra-500 text-white' 
                    : 'bg-charcoal-800 text-charcoal-400'
                }`}>
                  {validateStep(step.id) ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon === 'user' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon === 'id-card' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`text-xs mt-2 text-center ${
                  currentStep >= step.id ? 'text-terra-400' : 'text-charcoal-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-1 flex-1 mx-2 ${
                  validateStep(step.id) ? 'bg-green-500' : 
                  currentStep > step.id ? 'bg-terra-500' : 'bg-charcoal-800'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal & Contact Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display mb-4">Personal & Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Nickname / Riding Name</label>
                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Age *</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" max="70" className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required className="input">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Blood Group *</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required className="input">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Mobile Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required pattern="[0-9]{10}" className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">WhatsApp Number *</label>
                <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} required pattern="[0-9]{10}" className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input" disabled />
              </div>
              <div>
                <label className="block text-sm mb-1">City *</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Pincode *</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required pattern="[0-9]{6}" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Full Address *</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required className="input" rows="2"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Emergency Contact Name *</label>
                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Emergency Contact Number *</label>
                <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} required pattern="[0-9]{10}" className="input" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Identity & Bike Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display mb-4">Identity & Motorcycle Details</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 mb-4">
              <p className="text-sm text-yellow-400">📸 Upload clear, high-resolution images (JPG/PNG/PDF, max 5MB)</p>
            </div>
            
            <FileUpload
              label="Government ID Proof (Aadhar/Driving License/Passport)"
              accept="image/*,.pdf"
              maxSize={5 * 1024 * 1024}
              value={formData.governmentIdProof}
              onChange={(value) => setFormData(prev => ({ ...prev, governmentIdProof: value }))}
              required
              description="Upload a clear scan of your Aadhar card, driving license, or passport"
            />
            
            <FileUpload
              label="Rider Photograph"
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              value={formData.riderPhoto}
              onChange={(value) => setFormData(prev => ({ ...prev, riderPhoto: value }))}
              required
              description="Clear front face photo, helmet-off, recent image, high resolution (minimum 1080x1080)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm mb-1">Motorcycle Brand *</label>
                <input type="text" name="motorcycleBrand" value={formData.motorcycleBrand} onChange={handleChange} required className="input" placeholder="e.g., Royal Enfield" />
              </div>
              <div>
                <label className="block text-sm mb-1">Motorcycle Model *</label>
                <input type="text" name="motorcycleModel" value={formData.motorcycleModel} onChange={handleChange} required className="input" placeholder="e.g., Himalayan 450" />
              </div>
              <div>
                <label className="block text-sm mb-1">Engine CC *</label>
                <input type="text" name="engineCC" value={formData.engineCC} onChange={handleChange} required className="input" placeholder="e.g., 450cc" />
              </div>
              <div>
                <label className="block text-sm mb-1">Registration Number *</label>
                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required className="input" placeholder="e.g., MH12AB1234" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Off-road Experience Level *</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required className="input">
                  <option value="">Select Experience Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mt-4">
              <h4 className="font-semibold text-blue-400 mb-2">Photo Requirements:</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Clear front face visibility</li>
                <li>• Helmet-off photo</li>
                <li>• Recent image (within 6 months)</li>
                <li>• High resolution (minimum 1080x1080)</li>
                <li>• Good lighting, no shadows</li>
                <li>• Plain background preferred</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Medical & Consent */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display mb-4">Medical & Consent</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Medical Conditions</label>
                <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className="input" rows="2" placeholder="None or describe..."></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1">Allergies</label>
                <textarea name="allergies" value={formData.allergies} onChange={handleChange} className="input" rows="2" placeholder="None or describe..."></textarea>
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="physicallyFit" checked={formData.physicallyFit} onChange={handleChange} required className="w-4 h-4" />
                <span className="text-sm">I am physically fit for endurance/off-road activity *</span>
              </label>
            </div>

            <div className="border border-charcoal-700 rounded p-4 mt-6">
              <h4 className="font-semibold text-terra-400 mb-4">Consent & Agreements *</h4>
              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="agreeToRules" checked={formData.agreeToRules} onChange={handleChange} required className="w-4 h-4 mt-1" />
                  <span className="text-sm">I agree to the event rules & regulations *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="understandsRisk" checked={formData.understandsRisk} onChange={handleChange} required className="w-4 h-4 mt-1" />
                  <span className="text-sm">I understand motorsports involve risk *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="acceptsLiability" checked={formData.acceptsLiability} onChange={handleChange} required className="w-4 h-4 mt-1" />
                  <span className="text-sm">I accept the liability waiver *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="allowsMediaUsage" checked={formData.allowsMediaUsage} onChange={handleChange} required className="w-4 h-4 mt-1" />
                  <span className="text-sm">I allow media usage of my photos/videos *</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-charcoal-800">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn btn-outline"
          >
            ← Previous
          </button>
          
          {currentStep < STEPS.length ? (
            <button type="button" onClick={nextStep} className="btn btn-gold">
              Next Step →
            </button>
          ) : (
            <button type="submit" disabled={isLoading} className="btn btn-gold">
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
