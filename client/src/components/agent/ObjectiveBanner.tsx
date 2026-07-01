import { ArrowLeft } from 'lucide-react';

interface ObjectiveBannerProps {
  objective: string;
  currentStep: number;
  maxSteps: number;
  consecutiveCommands: number;
  commandBudget: number;
  editedFiles: string[];
}

export function ObjectiveBanner({
  objective,
  currentStep,
  maxSteps,
  consecutiveCommands,
  commandBudget,
  editedFiles
}: ObjectiveBannerProps) {
  return (
    <>
      {/* Changes Header Section */}
      {editedFiles.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '12px',
          height: '28px',
          flexShrink: 0,
          userSelect: 'none',
          backgroundColor: 'var(--color-bg-deep)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            <ArrowLeft size={11} className="cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" />
            <span>{editedFiles.length} file{editedFiles.length !== 1 ? 's' : ''} modified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              style={{ fontSize: '10px', color: 'var(--color-text-muted)', border: 'none', backgroundColor: 'transparent', padding: 0 }}>Reject all</button>
            <button className="hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'white',
                paddingTop: '2px',
                paddingBottom: '2px',
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600',
                border: 'none'
              }}>Accept all</button>
          </div>
        </div>
      )}

      {/* Goal details if active */}
      {objective && (
        <div style={{
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '8px',
          paddingBottom: '8px',
          flexShrink: 0,
          userSelect: 'none',
          backgroundColor: 'var(--color-bg-deep)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Active Objective</span>
          <p style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{objective}</p>
        </div>
      )}

      {/* Progress metrics */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '6px',
        paddingBottom: '6px',
        flexShrink: 0,
        userSelect: 'none',
        fontSize: '9px',
        backgroundColor: 'var(--color-bg-deep)',
        borderBottom: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-dimmed)',
        fontWeight: 'bold',
        letterSpacing: '0.05em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>STEPS:</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontSize: '10px' }}>{currentStep} / {maxSteps}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>BUDGET:</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontSize: '10px' }}>{consecutiveCommands} / {commandBudget}</span>
        </div>
      </div>
    </>
  );
}
