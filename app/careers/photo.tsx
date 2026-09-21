'use client';
import { useState } from 'react';
import { Users, Building2 } from 'lucide-react';
export default function CareerPhoto({src,alt,priority=false}:{src:string;alt:string;priority?:boolean}){
 const [failed,setFailed]=useState(false);
 if(failed){const office=src.includes('urban');const Icon=office?Building2:Users;return <div className="photo-fallback"><Icon size={48} strokeWidth={1}/><span>{office?'Pioneer Urban Square':'Life at HandySolver'}</span><small>{office?'Gurugram, India':'Explore our team gallery below'}</small></div>}
 return <img src={src} alt={alt} onError={()=>setFailed(true)} width={900} height={650} loading={priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':'auto'}/>;
}
