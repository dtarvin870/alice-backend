import React from 'react';
import { Cpu, Terminal, ShieldCheck } from 'lucide-react';

const RobotStatus = ({ isBusy }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="bg-umbrella-red p-1 rounded-sm rotate-45">
                        <Cpu className={`w-4 h-4 text-white -rotate-45 ${isBusy ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className="font-black text-umbrella-black tracking-[0.2em] text-[12px] uppercase">A.L.I.C.E. ONLINE</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-red-500 animate-ping' : 'bg-slate-200 border border-slate-300'}`} />
                    <span className={`text-[12px] font-black font-mono tracking-widest ${isBusy ? 'text-red-500' : 'text-slate-300'}`}>
                        {isBusy ? 'PROCESSING' : 'STANDBY'}
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 text-slate-400">
                    <Terminal className="w-3.5 h-3.5 mt-0.5 opacity-50" />
                    <span className="text-[12px] font-mono tracking-widest font-bold leading-relaxed uppercase whitespace-pre-line">
                        {isBusy
                            ? '> INITIALIZING_LOGISTICS_PROTOCOLS\n> EXTRACTION_IN_PROGRESS'
                            : '> UMBRELLA_OS_v4.1.18_READY\n> WAITING_FOR_OPERATOR_INPUT'}
                    </span>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[12px] font-mono font-black text-umbrella-red uppercase tracking-widest">
                        <span>Processor Load</span>
                        <span>{isBusy ? '87%' : '12%'}</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1 rounded-none overflow-hidden border border-slate-200">
                        <div
                            className={`h-full bg-umbrella-red transition-all duration-700 ${isBusy ? 'w-[87%]' : 'w-[12%]'}`}
                        />
                    </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-[12px] font-mono text-slate-400 uppercase tracking-[0.1em] font-bold">
                    <ShieldCheck className="w-3 h-3 text-umbrella-red/50" />
                    Subsystem Integrity: SECURE
                </div>

            </div>
        </div>
    );
};

export default RobotStatus;
