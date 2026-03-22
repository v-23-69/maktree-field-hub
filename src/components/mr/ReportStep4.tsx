import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CheckCircle2, Calendar, Users, MapPin } from 'lucide-react';
import { MOCK_USERS, MOCK_AREAS, MOCK_SUB_AREAS, MOCK_DOCTORS } from '@/lib/mock-data';
import { toast } from 'sonner';
import type { ReportFormData } from '@/pages/mr/NewReport';

interface Props {
  data: ReportFormData;
  onBack: () => void;
}

export default function ReportStep4({ data, onBack }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const manager = MOCK_USERS.find(u => u.id === data.workingWithId);
  const areas = data.selectedAreaIds.map(id => MOCK_AREAS.find(a => a.id === id)?.name).filter(Boolean);
  const subAreas = data.selectedSubAreaIds.map(id => MOCK_SUB_AREAS.find(s => s.id === id)?.name).filter(Boolean);
  const visitedDoctors = Object.keys(data.visits).map(id => MOCK_DOCTORS.find(d => d.id === id)).filter(Boolean);

  const handleSubmit = () => {
    toast.success('Report submitted successfully!');
    navigate('/mr/dashboard');
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h3 className="text-base font-semibold text-foreground">Review Your Report</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium text-foreground">{new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {manager && (
          <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Working With</p>
              <p className="text-sm font-medium text-foreground">{manager.full_name}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Areas Covered</p>
            <p className="text-sm font-medium text-foreground">{areas.join(', ')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subAreas.join(', ')}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Doctors Visited ({visitedDoctors.length})</p>
        <div className="space-y-1.5">
          {visitedDoctors.map(doc => (
            <div key={doc!.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground">{doc!.name}</span>
            </div>
          ))}
          {visitedDoctors.length === 0 && <p className="text-sm text-muted-foreground">No doctor visits added</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 touch-target rounded-lg">Back</Button>
        <Button
          onClick={() => setShowConfirm(true)}
          className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          Submit Report
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Submit Report?"
        description="Are you sure you want to submit? You cannot edit after submission."
        onConfirm={handleSubmit}
        confirmLabel="Submit"
      />
    </div>
  );
}
