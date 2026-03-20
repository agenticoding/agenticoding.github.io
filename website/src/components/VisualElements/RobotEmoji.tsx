import React from 'react';

export default function RobotEmoji({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true">
      {/* Static body: ears, head/torso/stalk */}
      <path fill="#C62828" d="M12.53,53.05c-4.57,0.01-8.28,3.72-8.28,8.29v38.38c0.01,4.57,3.71,8.27,8.28,8.28h5.55V53L12.53,53.05z"/>
      <path fill="#C62828" d="M115.72,53.05c4.57,0.01,8.28,3.72,8.28,8.29v38.38c-0.01,4.57-3.71,8.28-8.28,8.29h-5.55v-55L115.72,53.05z"/>
      <path fill="#90A4AE" d="M113.17,54.41l-0.12-10c-0.03-4.3-3.53-7.77-7.83-7.75H67.05V23.25c5.11-1.69,7.89-7.2,6.2-12.31c-1.69-5.11-7.2-7.89-12.31-6.2s-7.89,7.2-6.2,12.31c0.97,2.93,3.27,5.24,6.2,6.2v13.46H22.78c-4.28,0.01-7.75,3.47-7.78,7.75v71.78c0.03,4.28,3.5,7.74,7.78,7.76h82.44c4.3,0.01,7.8-3.46,7.83-7.76v-7.37h0.12L113.17,54.41z"/>
      {/* Antenna bulb */}
      <circle cx="64" cy="14" r="4" fill="#C62828"/>
      {/* Antenna sparks — pop in/out around bulb */}
      <rect x="62.5" y="4.5" width="3" height="3" transform="rotate(45, 64, 6)" fill="#C62828" className="idle-robot-spark" style={{ animationDelay: '0s' }}/>
      <rect x="55.57" y="8.5" width="3" height="3" transform="rotate(45, 57.07, 10)" fill="#C62828" className="idle-robot-spark" style={{ animationDelay: '0.4s' }}/>
      <rect x="69.43" y="8.5" width="3" height="3" transform="rotate(45, 70.93, 10)" fill="#C62828" className="idle-robot-spark" style={{ animationDelay: '0.8s' }}/>
      {/* Eyes: white fill + eyelid overlay for blink */}
      <circle cx="42.64" cy="66.81" r="11.5" fill="#FAFAFA"/>
      <circle cx="85" cy="66.81" r="11.5" fill="#FAFAFA"/>
      <circle cx="42.64" cy="66.81" r="11.5" fill="#90A4AE" className="idle-robot-blink"/>
      <circle cx="85" cy="66.81" r="11.5" fill="#90A4AE" className="idle-robot-blink"/>
      {/* Nose */}
      <path fill="#C62828" d="M64,85.33h-5.33c-0.55,0-1-0.45-1-1c0-0.16,0.04-0.31,0.11-0.45l2.74-5.41l2.59-4.78c0.26-0.49,0.87-0.67,1.35-0.41c0.17,0.09,0.31,0.23,0.41,0.41l2.61,5l2.71,5.19c0.25,0.49,0.06,1.09-0.43,1.35c-0.14,0.07-0.29,0.11-0.45,0.11L64,85.33z"/>
      {/* Mouth plate */}
      <path fill="#FAFAFA" d="M44.15,94.45h39.71c3.46,0,6.27,2.81,6.27,6.27v0.57c0,3.46-2.81,6.27-6.27,6.27H44.15c-3.46,0-6.27-2.81-6.27-6.27v-0.57C37.88,97.26,40.69,94.45,44.15,94.45z"/>
      {/* Teeth dividers — sweep left→right */}
      <rect x="44.02" y="94.47" width="2.36" height="13.09" fill="#555" className="idle-robot-teeth" style={{ animationDelay: '0s' }}/>
      <rect x="53.67" y="94.47" width="2.36" height="13.09" fill="#555" className="idle-robot-teeth" style={{ animationDelay: '0.5s' }}/>
      <rect x="62.88" y="94.47" width="2.36" height="13.09" fill="#555" className="idle-robot-teeth" style={{ animationDelay: '1s' }}/>
      <rect x="71.97" y="94.47" width="2.36" height="13.09" fill="#555" className="idle-robot-teeth" style={{ animationDelay: '1.5s' }}/>
      <rect x="81.62" y="94.47" width="2.36" height="13.09" fill="#555" className="idle-robot-teeth" style={{ animationDelay: '2s' }}/>
    </svg>
  );
}
