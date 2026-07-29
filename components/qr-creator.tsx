'use client';
import QRCode from 'qrcode';
import {useEffect,useRef,useState} from 'react';

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)}

export default function QRCreator(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const [name,setName]=useState('Summer menu');
  const [type,setType]=useState('restaurant');
  const [url,setUrl]=useState('https://example.com/menu');
  const [fg,setFg]=useState('#07111f');
  const [bg,setBg]=useState('#ffffff');
  const [slug,setSlug]=useState('summer-menu');
  const [message,setMessage]=useState('');
  const dynamicUrl = typeof window === 'undefined' ? `https://yourdomain.com/r/${slug}` : `${window.location.origin}/r/${slug}`;
  useEffect(()=>{if(canvas.current)QRCode.toCanvas(canvas.current,dynamicUrl,{width:260,margin:1,color:{dark:fg,light:bg},errorCorrectionLevel:'H'});},[dynamicUrl,fg,bg]);
  const download=()=>{const a=document.createElement('a');a.download=`${slug||'qr-code'}.png`;a.href=canvas.current?.toDataURL('image/png')||'';a.click()};
  async function save(){
    setMessage('Saving…');
    const response=await fetch('/api/qr',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,type,destinationUrl:url,slug,style:{fg,bg}})});
    const data=await response.json();
    setMessage(response.ok ? 'Campaign saved. This QR destination can now be changed without reprinting.' : data.error ?? 'Could not save campaign.');
  }
  return <div className="creator"><section className="card"><div className="sectionhead"><div><div className="eyebrow">Campaign builder</div><h3>Create a measurable QR channel</h3></div><span className="pill">DYNAMIC</span></div><div className="formgrid"><div className="field"><label>Campaign name</label><input className="input" value={name} onChange={e=>{setName(e.target.value);setSlug(slugify(e.target.value))}}/></div><div className="field"><label>Business goal</label><select className="input" value={type} onChange={e=>setType(e.target.value)}><option value="restaurant">Restaurant menu & orders</option><option value="reviews">Reviews & reputation</option><option value="social">Social growth</option><option value="website">Website traffic</option><option value="lead">Lead capture</option><option value="coupon">Coupon conversion</option><option value="event">Event engagement</option><option value="wifi">Guest Wi-Fi</option></select></div><div className="field full"><label>Destination URL</label><input className="input" value={url} onChange={e=>setUrl(e.target.value)}/></div><div className="field full"><label>Permanent short link</label><div className="slugrow"><span>/r/</span><input className="input" value={slug} onChange={e=>setSlug(slugify(e.target.value))}/></div></div><div className="field"><label>Foreground</label><input className="input" type="color" value={fg} onChange={e=>setFg(e.target.value)}/></div><div className="field"><label>Background</label><input className="input" type="color" value={bg} onChange={e=>setBg(e.target.value)}/></div></div><div className="actions"><button className="btn" onClick={save}>Save campaign</button><button className="btn secondary" onClick={download}>Download PNG</button></div>{message&&<p className="notice">{message}</p>}</section><aside className="card preview"><span className="pill">LIVE PREVIEW</span><div className="qrbox"><canvas ref={canvas}/></div><code>{dynamicUrl}</code><p className="muted small">Every scan passes through QR Command so the destination can change and campaign activity can be measured.</p></aside></div>}
