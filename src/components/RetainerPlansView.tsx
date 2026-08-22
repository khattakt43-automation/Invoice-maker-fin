import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Shield,
  Zap,
  Server,
  Headphones,
  ArrowRight,
  Database
} from 'lucide-react';
import { RetainerPlan } from '../types';
import { initialRetainerPlans } from '../data/mockData';
import { BookDiscoveryModal } from './BookDiscoveryModal';

export const RetainerPlansView: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<RetainerPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlanClick = (plan: RetainerPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div id="retainer-plans-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00855a]/10 text-[#006a46] text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Fully Managed Billing Operations
        </div>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
          Tailored Retainer Plans
        </h2>
        <p className="text-base text-[#545f73]">
          Enterprise-grade billing operations and automated compliance for Malaysian businesses.
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {initialRetainerPlans.map((plan) => {
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 relative ${
                isPopular
                  ? 'bg-[#006a46] text-white shadow-2xl scale-105 border-2 border-[#8bf8c2]/50 z-10 ring-4 ring-[#006a46]/20'
                  : 'bg-white text-[#0b1c30] border border-[#bdcac0]/60 shadow-md hover:shadow-xl'
              }`}
            >
              {plan.tag && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#8bf8c2] text-[#002113] font-mono text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {plan.tag}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isPopular ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      isPopular ? 'text-[#eaf1ff]/80' : 'text-[#545f73]'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  {plan.priceFormatted !== 'Custom' && (
                    <span
                      className={`text-xs font-mono font-bold ${
                        isPopular ? 'text-[#8bf8c2]' : 'text-[#545f73]'
                      }`}
                    >
                      RM
                    </span>
                  )}
                  <span
                    className={`text-4xl font-extrabold tracking-tight font-mono ${
                      isPopular ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    {plan.priceFormatted}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-xs font-medium ${
                        isPopular ? 'text-[#eaf1ff]/70' : 'text-[#545f73]'
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>

                <div
                  className={`border-t pt-6 space-y-3 ${
                    isPopular ? 'border-white/20' : 'border-[#bdcac0]/40'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isPopular ? 'text-[#8bf8c2]' : 'text-[#545f73]'
                    }`}
                  >
                    What's included
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            isPopular
                              ? 'bg-[#8bf8c2] text-[#002113]'
                              : 'bg-[#00855a]/15 text-[#006a46]'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                        <span className={isPopular ? 'text-[#eaf1ff]' : 'text-[#3e4942]'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
                    isPopular
                      ? 'bg-white text-[#006a46] hover:bg-[#eff4ff]'
                      : 'bg-[#006a46] text-white hover:bg-[#00855a]'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* White-Glove Onboarding Banner */}
      <div className="bg-[#eff4ff] rounded-3xl p-8 border border-[#00855a]/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-[#0b1c30]">
            White-Glove Enterprise Onboarding & Migration
          </h3>
          <p className="text-xs text-[#545f73] max-w-2xl leading-relaxed">
            Need assistance migrating historical ledgers from SAP, AutoCount, SQL Account, or QuickBooks? Our cloud migration engineers handle 100% of data formatting and SST tax rate reconciliation.
          </p>
        </div>
        <button
          onClick={() => handlePlanClick(initialRetainerPlans[1])}
          className="bg-[#006a46] text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-[#00855a] transition-all whitespace-nowrap shadow-sm active:scale-95"
        >
          Talk to Migration Specialist
        </button>
      </div>

      {/* Enterprise Multi-Tenant Architecture Section */}
      <div className="space-y-6 pt-6 border-t border-[#bdcac0]/40">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h3 className="text-2xl font-bold text-[#0b1c30]">
            Enterprise-Grade Multi-Tenant Architecture
          </h3>
          <p className="text-xs text-[#545f73]">
            Built with uncompromising data privacy, automated compliance, and high throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#0b1c30]">Absolute Schema Isolation</h4>
            <p className="text-xs text-[#545f73] leading-relaxed">
              Every enterprise tenant operates with independent database schema boundaries preventing data leakage or accidental cross-talk.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#0b1c30]">Infinite Scalability</h4>
            <p className="text-xs text-[#545f73] leading-relaxed">
              Engineered on modern cloud containers to generate thousands of PDF tax invoices concurrently with zero latency bottlenecks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#0b1c30]">LHDN e-Invoice Ready</h4>
            <p className="text-xs text-[#545f73] leading-relaxed">
              Pre-configured for upcoming Malaysian Inland Revenue Board (LHDN) XML/JSON validation requirements and QR validation.
            </p>
          </div>
        </div>
      </div>

      <BookDiscoveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
      />
    </div>
  );
};
