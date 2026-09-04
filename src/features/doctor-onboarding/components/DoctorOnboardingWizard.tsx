import { useDoctorOnboarding } from '../hooks/useDoctorOnboarding';
import { Step1Name } from './Step1Name';
import { Step2EmailCode } from './Step2EmailCode';
import { Step3XmlUpload } from './Step3XmlUpload';
import { Step4CertificateA1 } from './Step4CertificateA1';
import { Step5BankConnect } from './Step5BankConnect';
import { Step6HomologationEmission } from './Step6HomologationEmission';
import { Logo } from '@/shared/components/Logo';
import { X } from 'lucide-react';

interface DoctorOnboardingWizardProps {
  onExit?: () => void;
  onFinish?: () => void;
}

export function DoctorOnboardingWizard({ onExit, onFinish }: DoctorOnboardingWizardProps) {
  const {
    currentStep,
    state,
    isSimulatingEmission,
    updateState,
    nextStep,
    prevStep,
    handleXmlUpload,
    handleLoadSampleXml,
    handleValidateCertificate,
    handleSkipCertificate,
    handleConnectBank,
    handleEmailConfirmed,
    runHomologationEmission,
  } = useDoctorOnboarding();

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col font-sans antialiased">
      {/* Barra de Progresso Fina no Topo */}
      <div className="w-full h-1 bg-neutral-100 sticky top-0 z-50">
        <div
          className="h-full bg-neutral-900 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Header Ultra Minimalista */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <Logo className="h-5 w-auto filter grayscale" />
          <span className="text-xs text-neutral-400 font-normal">
            Médicos
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-neutral-400">
            {currentStep} de 6
          </span>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
              title="Sair do cadastro"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Central em Modo White Minimalista */}
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-20 max-w-4xl w-full mx-auto py-8">
        {currentStep === 1 && (
          <Step1Name
            state={state}
            onUpdate={updateState}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <Step2EmailCode
            state={state}
            onUpdate={updateState}
            onNext={nextStep}
            onPrev={prevStep}
            onEmailConfirmed={handleEmailConfirmed}
          />
        )}

        {currentStep === 3 && (
          <Step3XmlUpload
            state={state}
            onXmlUpload={handleXmlUpload}
            onLoadSample={handleLoadSampleXml}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 4 && (
          <Step4CertificateA1
            state={state}
            onValidateCert={handleValidateCertificate}
            onSkipCert={handleSkipCertificate}
            onPrev={prevStep}
          />
        )}

        {currentStep === 5 && (
          <Step5BankConnect
            state={state}
            onConnectBank={handleConnectBank}
            onPrev={prevStep}
          />
        )}

        {currentStep === 6 && (
          <Step6HomologationEmission
            state={state}
            isSimulating={isSimulatingEmission}
            onRunEmission={runHomologationEmission}
            onFinish={() => (onFinish ? onFinish() : onExit?.())}
          />
        )}
      </main>
    </div>
  );
}
