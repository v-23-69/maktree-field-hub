import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { usePreventAccidentalBack } from '@/hooks/usePreventAccidentalBack';
import BottomNav from '@/components/shared/BottomNav';
import ReportHistoryView from '@/components/mr/ReportHistoryView';
import { useAuth } from '@/hooks/useAuth';

export default function ReportHistory() {
  const { goBack: safeGoBack } = usePreventAccidentalBack(true);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isManager = user?.role === 'manager';
  const initialRequestLateMode = searchParams.get('requestLate') === '1';

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={isManager ? 'My report history' : 'Report History'}
        showBack
        onBack={safeGoBack}
      />

      <div className="mx-auto w-full px-4 py-4 max-w-lg md:px-8 md:max-w-3xl lg:px-10 lg:max-w-5xl">
        {user?.id && (
          <ReportHistoryView
            subjectMrId={user.id}
            subjectName={user.full_name ?? 'You'}
            linkMode={isManager ? 'manager-self' : 'mr'}
            showPdfCard={!isManager}
            enableLateRequest={!isManager}
            initialRequestLateMode={initialRequestLateMode}
          />
        )}
      </div>

      <BottomNav role={isManager ? 'manager' : 'mr'} />
    </div>
  );
}
