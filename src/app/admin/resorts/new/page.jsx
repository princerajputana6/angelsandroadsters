'use client';
import ResortForm from '@/components/admin/ResortForm';

export default function NewResortPage() {
  return (
    <div>
      <h1 className="text-3xl font-display mb-1">New resort</h1>
      <p className="text-sm text-charcoal-400 mb-6">Configure the resort, its stay window and room inventory.</p>
      <ResortForm />
    </div>
  );
}
