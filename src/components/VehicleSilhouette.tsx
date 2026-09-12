import { findVehicleDefinition } from '../data/vehicles';
import { useId } from 'react';

type Props = { catalogId: string; className?: string };

/** Original placeholder profiles; final vehicle art is a later content pass. */
export function VehicleSilhouette({ catalogId, className = '' }: Props) {
  const id = `paint-${useId().replace(/:/g, '')}`;
  const type = findVehicleDefinition(catalogId)?.bodyType;
  const hatch = type === 'hatchback';
  const wagon = type === 'wagon';
  const sedan = type === 'sedan';
  const roadster = type === 'roadster';
  const turbo = catalogId === 'rz-t';
  const body = roadster ? 'M49 151 L75 124 L176 112 L200 88 L214 91 L201 119 L301 119 L324 109 L428 134 L446 151 L446 179 L49 179 Z' : wagon ? 'M48 150 L62 76 L277 66 L332 110 L436 130 L450 151 L447 179 L49 179 Z'
    : sedan ? 'M48 152 L76 126 L135 115 L184 68 L293 68 L344 114 L436 131 L450 152 L447 179 L49 179 Z'
    : hatch
    ? 'M62 153 L73 116 L122 108 L154 60 L280 60 L328 113 L397 127 L426 148 L426 179 L62 179 Z'
    : 'M49 150 L70 123 L123 113 L190 65 L297 68 L350 116 L433 131 L448 151 L446 179 L49 179 Z';
  return (
    <svg className={`vehicleSilhouette ${hatch ? 'profileHatch' : turbo ? 'profileTurbo' : 'profileCoupe'} ${className}`}
      viewBox="0 0 500 250" fill="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id={id} x1="250" y1="62" x2="250" y2="184" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" /><stop offset="1" stopColor="#242c30" />
      </linearGradient></defs>
      <ellipse cx="253" cy="205" rx="218" ry="18" fill="#000" opacity=".48" />
      <path d="M22 215H478 M34 227H465" stroke="#65706f" opacity=".25" />
      <path d={body} fill={`url(#${id})`} stroke="currentColor" strokeWidth="2" />
      <path d={roadster ? 'M182 112L203 93L207 94L194 114Z' : wagon ? 'M75 84L165 76V111H70Z M177 75H222V111H177Z M234 75H282L314 111H234Z' : hatch ? 'M136 107L166 70H223V107Z M234 70H274L310 109H234Z'
        : 'M143 111L195 76H236V111Z M247 77H289L330 114H247Z'} fill="#121d23" stroke="#b4cbd0" strokeOpacity=".32" />
      {(sedan || wagon) && <path d="M161 116V164 M285 117V167 M176 131H190 M298 131H312" stroke="#10181c" strokeWidth="2" />}
      <path d="M228 113V168 M77 154H425 M181 131H198 M336 133H350" stroke="#080e12" strokeWidth="2" opacity=".8" />
      <path d={turbo ? 'M65 119V104H104V111H72' : 'M73 124H105'} stroke="currentColor" strokeWidth="5" />
      <path d="M403 140L427 144" stroke="#e6d6a5" strokeWidth="8" />
      <path d="M65 139L78 137" stroke="#cf5844" strokeWidth="7" />
      <path d="M202 163L215 164 M370 151L389 155 M159 143L165 144" stroke="#bababa" strokeOpacity=".28" />
      {[126, 365].map((x) => <g key={x}>
        <circle cx={x} cy="177" r="34" fill="#090d10" stroke="#424a4e" strokeWidth="3" />
        <circle cx={x} cy="177" r="22" fill="#535b5e" stroke="#989f9c" strokeWidth="2" />
        <circle cx={x} cy="177" r="8" fill="#111b20" />
        {[0, 60, 120].map((angle) => <path key={angle} d={`M${x - 19} 177H${x + 19}`}
          stroke="#202b31" strokeWidth="5" transform={`rotate(${angle} ${x} 177)`} />)}
        <circle cx={x} cy="177" r="4" fill="#aeb6b3" />
      </g>)}
    </svg>
  );
}
