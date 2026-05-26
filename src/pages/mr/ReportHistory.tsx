import PageHeader from '@/components/shared/PageHeader';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import BottomNav from '@/components/shared/BottomNav';
import ReportHistoryView from '@/components/mr/ReportHistoryView';
import { useAuth } from '@/hooks/useAuth';

export default function ReportHistory() {
  const { goBack: safeGoBack } = usePreventAccidentalBack(true);
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={isManager ? 'My report history' : 'Report History'}
        showBack
        onBack={safeGoBack}
      />

      <div className="px-4 md:px-6 py-4 max-w-2xl lg:max-w-4xl mx-auto">
        {user?.id && (
          <ReportHistoryView
            subjectMrId={user.id}
            subjectName={user.full_name ?? 'You'}
            linkMode={isManager ? 'manager-self' : 'mr'}
            showPdfCard={!isManager}
          />
        )}
      </div>

      <BottomNav role={isManager ? 'manager' : 'mr'} />
    </div>
  );
}
