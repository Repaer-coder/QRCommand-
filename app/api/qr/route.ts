import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const payload = z.object({
  name:z.string().min(2).max(100),
  type:z.string().min(2).max(40),
  destinationUrl:z.string().url(),
  slug:z.string().regex(/^[a-z0-9-]{3,50}$/),
  style:z.object({fg:z.string(),bg:z.string()})
});

export async function POST(request:Request){
  const parsed=payload.safeParse(await request.json());
  if(!parsed.success) return NextResponse.json({error:'Check the campaign name, URL, and short link.'},{status:400});
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:'Sign in to save campaigns.'},{status:401});
  const {data:org}=await supabase.from('organizations').select('id').eq('owner_id',user.id).limit(1).maybeSingle();
  let orgId=org?.id;
  if(!orgId){
    const created=await supabase.from('organizations').insert({name:'My QR Command Workspace',owner_id:user.id}).select('id').single();
    if(created.error) return NextResponse.json({error:created.error.message},{status:400});
    orgId=created.data.id;
  }
  const {data,error}=await supabase.from('qr_codes').insert({organization_id:orgId,name:parsed.data.name,slug:parsed.data.slug,destination_url:parsed.data.destinationUrl,qr_type:parsed.data.type,style:parsed.data.style,created_by:user.id}).select('id,slug').single();
  if(error) return NextResponse.json({error:error.code==='23505'?'That short link is already taken.':error.message},{status:400});
  return NextResponse.json(data,{status:201});
}
