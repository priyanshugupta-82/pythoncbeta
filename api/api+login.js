// api/api+login.js

const RATE_LIMIT = new Map(); // IP → {count, time}
const LIMIT = 10; // max AI calls
const WINDOW = 60*1000; // 1 min

export default async function handler(req,res){
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  let data = RATE_LIMIT.get(ip) || {count:0, time:now};

  if(now - data.time > WINDOW){ data.count=0; data.time=now; }
  data.count++; RATE_LIMIT.set(ip,data);
  if(data.count > LIMIT){
    return res.status(429).json({fix:"Error: rate limit exceeded.\nFix: wait 1 minute and try again."});
  }

  const body = req.body || {};
  const {email,password,error} = body;

  // LOGIN
  if(email!==undefined && password!==undefined){
    if(email==="test@pythoncai.in" && password==="pythoncaiisbest911"){
      return res.json({ok:true});
    }
    return res.json({ok:false});
  }

  // AI FIX
  if(error){
    const prompt = `
You are a Python error fixer.
User code caused this error:
${error}
Respond strictly in this format:
Error: on line X <description>
Fix: line X be <corrected code>
Rules: ONLY 2 lines, no markdown, no extra text.
`;

    try{
      const r = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method:"POST",
          headers:{
            "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            model:"arcee-ai/trinity-large-preview:free",
            temperature:0,
            messages:[{role:"user", content:prompt}]
          })
        }
      );
      const d = await r.json();
      const text = d?.choices?.[0]?.message?.content || 
        "Error: unknown error.\nFix: check your code.";
      return res.json({fix:text});
    }catch(e){
      return res.json({
        fix:"Error: AI service unavailable.\nFix: try again later."
      });
    }
  }

  return res.status(400).end();
}
