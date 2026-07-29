import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data:code}=await supabase.from('qr_codes').select('id,destination_url,status,expires_at').eq('slug',slug).maybeSingle();
  if(!code||code.status!=='active') return NextResponse.redirect(new URL('/not-found',request.url));
  if(code.expires_at&&new Date(code.expires_at)<new Date()) return NextResponse.redirect(new URL('/expired',request.url));
  const userAgent=request.headers.get('user-agent')??'';
  const device=/mobile|iphone|android/i.test(userAgent)?'mobile':/tablet|ipad/i.test(userAgent)?'tablet':'desktop';
  await supabase.from('scan_events').insert({qr_code_id:code.id,device_type:device,referrer:request.headers.get('referer')});
  await supabase.rpc('increment_scan_count',{code_id:code.id});
  return NextResponse.redirect(code.destination_url,302);
}
