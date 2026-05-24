'use client';
import { useState } from 'react';
import { useCompleteProfileMutation } from '@/store/api';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import IndianLocationPicker from '@/components/IndianLocationPicker';

export default function GroupProfileForm({ registration, userEmail }) {
  const router = useRouter();
  const [completeProfile, { isLoading }] = useCompleteProfileMutation();
  const [selectedMember, setSelectedMember] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [groupPhoto, setGroupPhoto] = useState(registration.teamPhoto || '');
  
  const [members, setMembers] = useState(
    registration.members?.map(m => ({
      _id: m._id,
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      
      // Step 1: Personal & Contact
      nickname: m.nickname || '',
      dateOfBirth: m.dateOfBirth || '',
      age: m.age || '',
      gender: m.gender || '',
      bloodGroup: m.bloodGroup || '',
      whatsappNumber: m.whatsappNumber || '',
      city: m.city || '',
      state: m.state || '',
      address: m.address || '',
      pincode: m.pincode || '',
      emergencyContact: m.emergencyContact || '',
      emergencyContactNumber: m.emergencyContactNumber || '',
      
      // Step 2: Identity & Bike
      governmentIdProof: m.governmentIdProof || '',
      riderPhoto: m.riderPhoto || '',
      motorcycleBrand: m.motorcycleBrand || '',
      motorcycleModel: m.motorcycleModel || '',
      engineCC: m.engineCC || '',
      registrationNumber: m.registrationNumber || '',
      experienceLevel: m.experienceLevel || '',
      
      // Step 3: Medical & Consent
      medicalConditions: m.medicalConditions || '',
      allergies: m.allergies || '',
      physicallyFit: m.physicallyFit || false,
      agreeToRules: m.agreeToRules || false,
      understandsRisk: m.understandsRisk || false,
      acceptsLiability: m.acceptsLiability || false,
      allowsMediaUsage: m.allowsMediaUsage || false,
      
      profileCompleted: m.profileCompleted || false,
    })) || []
  );

  const handleMemberChange = (field, value) => {
    const updated = [...members];
    updated[selectedMember] = { ...updated[selectedMember], [field]: value };
    setMembers(updated);
  };

  const validateStep = (step, member) => {
    switch (step) {
      case 1: // Personal & Contact
        return !!(
          member.name &&
          member.email &&
          member.phone &&
          member.age &&
          member.gender &&
          member.bloodGroup &&
          member.whatsappNumber &&
          member.city &&
          member.state &&
          member.address &&
          member.pincode &&
          member.emergencyContact &&
          member.emergencyContactNumber
        );
      
      case 2: // Identity & Bike
        return !!(
          member.governmentIdProof &&
          member.riderPhoto &&
          member.motorcycleBrand &&
          member.motorcycleModel &&
          member.engineCC &&
          member.registrationNumber &&
          member.experienceLevel
        );
      
      case 3: // Medical & Consent
        return !!(
          member.physicallyFit &&
          member.agreeToRules &&
          member.understandsRisk &&
          member.acceptsLiability &&
          member.allowsMediaUsage
        );
      
      default:
        return false;
    }
  };

  const handleSubmitMember = async () => {
    const member = members[selectedMember];
    
    // Validate all steps for this member
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step, member)) {
        alert(`Please complete all required fields in Step ${step}`);
        setCurrentStep(step);
        return;
      }
    }

    try {
      // Update only this member and group photo
      const updatedMember = { ...member, profileCompleted: true };
      const updatedMembers = [...members];
      updatedMembers[selectedMember] = updatedMember;
      
      await completeProfile({ 
        id: registration._id, 
        members: [updatedMember], // Send only this member
        teamPhoto: groupPhoto // Include group photo
      }).unwrap();
      
      // Update local state
      setMembers(updatedMembers);
      
      alert(`Profile completed for ${member.name}!`);
      
      // Move to next incomplete member or stay on current
      const nextIncomplete = updatedMembers.findIndex(m => !m.profileCompleted);
      if (nextIncomplete !== -1) {
        setSelectedMember(nextIncomplete);
        setCurrentStep(1);
      }
      
    } catch (error) {
      alert('Failed to save profile: ' + (error.data?.message || error.message));
    }
  };

  const handleCompleteAll = async () => {
    try {
      await completeProfile({ 
        id: registration._id, 
        members,
        teamPhoto: groupPhoto 
      }).unwrap();
      alert('All profiles completed successfully!');
      router.push(`/booking/${registration.ticketId}`);
    } catch (error) {
      alert('Failed to save profiles: ' + (error.data?.message || error.message));
    }
  };

  const nextStep = () => {
    const member = members[selectedMember];
    if (validateStep(currentStep, member)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert(`Please fill all required fields in Step ${currentStep}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const currentMember = members[selectedMember];
  if (!currentMember) return <div>No members found</div>;

  const STEPS = [
    { id: 1, title: 'Personal & Contact', icon: 'user' },
    { id: 2, title: 'Identity & Bike', icon: 'id-card' },
    { id: 3, title: 'Medical & Consent', icon: 'check-circle' },
  ];

  const completedCount = members.filter(m => m.profileCompleted).length;
  const allCompleted = completedCount === members.length;

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-display mb-2">Group Profile Completion</h2>
        <p className="text-charcoal-400">Complete profiles individually for each team member</p>
        <div className="mt-2 text-sm">
          <span className="text-green-400">{completedCount}</span> of {members.length} profiles completed
        </div>
      </div>

      {/* Group Photo Section */}
      <div className="mb-6 p-4 bg-charcoal-900/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-terra-400">Team Photo</h3>
        <FileUpload
          label="Team Photo (All 4 registered riders visible)"
          accept="image/*"
          maxSize={5 * 1024 * 1024}
          value={groupPhoto}
          onChange={setGroupPhoto}
          required
          description="Upload a clear group photo of all 4 officially registered riders. Landscape orientation preferred, minimum 1080x1920."
        />
      </div>

      {/* Member Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {members.map((member, index) => (
          <button
            key={member._id}
            type="button"
            onClick={() => { setSelectedMember(index); setCurrentStep(1); }}
            className={`px-4 py-2 rounded whitespace-nowrap text-sm ${
              selectedMember === index
                ? 'bg-terra-500 text-white'
                : member.profileCompleted
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-charcoal-800 text-charcoal-400 border border-charcoal-600'
            }`}
          >
            {member.profileCompleted && '✓ '}
            {member.name || `Member ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Progress for current member */}
      <div className="mb-6 p-4 bg-charcoal-900/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">
            {currentMember.profileCompleted ? '✅ Completed' : '⏳ In Progress'}: {currentMember.name}
          </h3>
          {currentMember.profileCompleted && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Profile Complete
            </span>
          )}
        </div>
        <div className="flex space-x-1">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded ${
                validateStep(step.id, currentMember)
                  ? 'bg-green-500'
                  : currentStep >= step.id
                  ? 'bg-yellow-500'
                  : 'bg-charcoal-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  validateStep(step.id, currentMember)
                    ? 'bg-green-500 text-white'
                    : currentStep >= step.id 
                    ? 'bg-terra-500 text-white' 
                    : 'bg-charcoal-800 text-charcoal-400'
                }`}>
                  {validateStep(step.id, currentMember) ? (
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
                  validateStep(step.id, currentMember) ? 'bg-green-500' : 
                  currentStep > step.id ? 'bg-terra-500' : 'bg-charcoal-800'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Step 1: Personal & Contact */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-display mb-4">Personal & Contact Details - {currentMember.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={currentMember.name} 
                  onChange={(e) => handleMemberChange('name', e.target.value)} 
                  required 
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Nickname / Riding Name</label>
                <input 
                  type="text" 
                  value={currentMember.nickname} 
                  onChange={(e) => handleMemberChange('nickname', e.target.value)} 
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Date of Birth *</label>
                <input 
                  type="date" 
                  value={currentMember.dateOfBirth} 
                  onChange={(e) => handleMemberChange('dateOfBirth', e.target.value)} 
                  required 
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Age *</label>
                <input 
                  type="number" 
                  value={currentMember.age} 
                  onChange={(e) => handleMemberChange('age', e.target.value)} 
                  required 
                  min="18"
                  max="70"
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Gender *</label>
                <select 
                  value={currentMember.gender} 
                  onChange={(e) => handleMemberChange('gender', e.target.value)} 
                  required 
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Blood Group *</label>
                <select 
                  value={currentMember.bloodGroup} 
                  onChange={(e) => handleMemberChange('bloodGroup', e.target.value)} 
                  required 
                  className="input"
                >
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
                <input 
                  type="tel" 
                  value={currentMember.phone} 
                  onChange={(e) => handleMemberChange('phone', e.target.value)} 
                  required 
                  pattern="[0-9]{10}"
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">WhatsApp Number *</label>
                <input 
                  type="tel" 
                  value={currentMember.whatsappNumber} 
                  onChange={(e) => handleMemberChange('whatsappNumber', e.target.value)} 
                  required 
                  pattern="[0-9]{10}"
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email *</label>
                <input 
                  type="email" 
                  value={currentMember.email} 
                  onChange={(e) => handleMemberChange('email', e.target.value)} 
                  required 
                  className="input" 
                  disabled 
                />
              </div>
              <div className="md:col-span-2">
                <IndianLocationPicker
                  state={currentMember.state}
                  city={currentMember.city}
                  onStateChange={(val) => handleMemberChange('state', val)}
                  onCityChange={(val) => handleMemberChange('city', val)}
                  required
                  stateLabel="State"
                  cityLabel="City"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Pincode *</label>
                <input 
                  type="text" 
                  value={currentMember.pincode} 
                  onChange={(e) => handleMemberChange('pincode', e.target.value)} 
                  required 
                  pattern="[0-9]{6}"
                  className="input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Full Address *</label>
              <textarea 
                value={currentMember.address} 
                onChange={(e) => handleMemberChange('address', e.target.value)} 
                required 
                className="input" 
                rows="2"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Emergency Contact Name *</label>
                <input 
                  type="text" 
                  value={currentMember.emergencyContact} 
                  onChange={(e) => handleMemberChange('emergencyContact', e.target.value)} 
                  required 
                  className="input" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Emergency Contact Number *</label>
                <input 
                  type="tel" 
                  value={currentMember.emergencyContactNumber} 
                  onChange={(e) => handleMemberChange('emergencyContactNumber', e.target.value)} 
                  required 
                  pattern="[0-9]{10}"
                  className="input" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Identity & Bike */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-display mb-4">Identity & Motorcycle Details - {currentMember.name}</h3>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-4">
              <p className="text-sm text-yellow-400">Upload clear, high-resolution files (JPG/PNG/PDF, max 3MB)</p>
            </div>
            
            <FileUpload
              label="Government ID Proof (Aadhar/Driving License/Passport)"
              accept="image/*,.pdf"
              maxSize={5 * 1024 * 1024}
              value={currentMember.governmentIdProof}
              onChange={(value) => handleMemberChange('governmentIdProof', value)}
              required
              description="Upload clear scan of ID document"
            />
            
            <FileUpload
              label="Rider Photograph"
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              value={currentMember.riderPhoto}
              onChange={(value) => handleMemberChange('riderPhoto', value)}
              required
              description="Clear front face, helmet-off, recent image"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm mb-1">Motorcycle Brand *</label>
                <input 
                  type="text" 
                  value={currentMember.motorcycleBrand} 
                  onChange={(e) => handleMemberChange('motorcycleBrand', e.target.value)} 
                  required 
                  className="input" 
                  placeholder="e.g., Royal Enfield"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Motorcycle Model *</label>
                <input 
                  type="text" 
                  value={currentMember.motorcycleModel} 
                  onChange={(e) => handleMemberChange('motorcycleModel', e.target.value)} 
                  required 
                  className="input" 
                  placeholder="e.g., Himalayan 450"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Engine CC *</label>
                <input 
                  type="text" 
                  value={currentMember.engineCC} 
                  onChange={(e) => handleMemberChange('engineCC', e.target.value)} 
                  required 
                  className="input" 
                  placeholder="e.g., 450cc"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Registration Number *</label>
                <input 
                  type="text" 
                  value={currentMember.registrationNumber} 
                  onChange={(e) => handleMemberChange('registrationNumber', e.target.value)} 
                  required 
                  className="input" 
                  placeholder="e.g., MH12AB1234"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Off-road Experience Level *</label>
                <select 
                  value={currentMember.experienceLevel} 
                  onChange={(e) => handleMemberChange('experienceLevel', e.target.value)} 
                  required 
                  className="input"
                >
                  <option value="">Select Experience Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Medical & Consent */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-display mb-4">Medical & Consent - {currentMember.name}</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Medical Conditions</label>
                <textarea 
                  value={currentMember.medicalConditions} 
                  onChange={(e) => handleMemberChange('medicalConditions', e.target.value)} 
                  className="input" 
                  rows="2"
                  placeholder="None or describe any conditions"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1">Allergies</label>
                <textarea 
                  value={currentMember.allergies} 
                  onChange={(e) => handleMemberChange('allergies', e.target.value)} 
                  className="input" 
                  rows="2"
                  placeholder="None or describe any allergies"
                ></textarea>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  checked={currentMember.physicallyFit} 
                  onChange={(e) => handleMemberChange('physicallyFit', e.target.checked)} 
                  required 
                  className="w-4 h-4" 
                />
                <span className="text-sm">I am physically fit for endurance/off-road activity *</span>
              </label>
            </div>

            <div className="border border-charcoal-700 rounded p-4 mt-6">
              <h4 className="font-semibold text-terra-400 mb-4">Consent & Agreements *</h4>
              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentMember.agreeToRules} 
                    onChange={(e) => handleMemberChange('agreeToRules', e.target.checked)} 
                    required 
                    className="w-4 h-4 mt-1" 
                  />
                  <span className="text-sm">I agree to the event rules & regulations *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentMember.understandsRisk} 
                    onChange={(e) => handleMemberChange('understandsRisk', e.target.checked)} 
                    required 
                    className="w-4 h-4 mt-1" 
                  />
                  <span className="text-sm">I understand motorsports involve risk *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentMember.acceptsLiability} 
                    onChange={(e) => handleMemberChange('acceptsLiability', e.target.checked)} 
                    required 
                    className="w-4 h-4 mt-1" 
                  />
                  <span className="text-sm">I accept the liability waiver *</span>
                </label>
                <label className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentMember.allowsMediaUsage} 
                    onChange={(e) => handleMemberChange('allowsMediaUsage', e.target.checked)} 
                    required 
                    className="w-4 h-4 mt-1" 
                  />
                  <span className="text-sm">I allow media usage of my photos/videos *</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-charcoal-800">
          <button 
            type="button" 
            onClick={prevStep} 
            disabled={currentStep === 1} 
            className="btn btn-outline"
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="btn btn-gold"
              >
                Next Step
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubmitMember}
                  disabled={isLoading || currentMember.profileCompleted}
                  className="btn btn-gold"
                >
                  {isLoading ? 'Saving...' : 
                   currentMember.profileCompleted ? 'Profile Complete ✓' : 
                   'Complete This Profile'}
                </button>
                
                {allCompleted && (
                  <button
                    type="button"
                    onClick={handleCompleteAll}
                    disabled={isLoading}
                    className="btn btn-green"
                  >
                    Finish & View QR Code
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Completion Status */}
        {completedCount > 0 && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold">
                  {completedCount} of {members.length} profiles completed
                </p>
                <p className="text-sm text-green-300">
                  {allCompleted 
                    ? 'All profiles complete! Click "Finish & View QR Code" to access your event pass.'
                    : `${members.length - completedCount} more profile(s) to complete.`
                  }
                </p>
              </div>
              {allCompleted && (
                <div className="text-2xl">🎉</div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
