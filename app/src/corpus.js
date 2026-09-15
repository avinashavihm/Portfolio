/* The closed corpus. Every factual claim the avatar can make lives here and
   nowhere else. Sourced from Avinash HM's resume, verbatim in substance. */

export const PROFILE = {
  name:'Avinash HM',
  title:'AI Engineer',
  subtitle:'Generative AI & LLM Engineer · Agentic AI Specialist · Applied AI Researcher',
  location:'Bangalore, India',
  email:'avi.hm24@gmail.com',
  phone:'+91 8951228018',
  linkedin:'linkedin.com/in/avinash-hm007',
  github:'github.com/Avinashhmavi',
  site:'avihm.site'
};

/* Each fact carries the tags that retrieve it and the source shown in the UI. */
export const FACTS = [
  { id:'summary', src:'Résumé — summary', tags:['yourself','summary','introduce','introduction','profile','overview','bio'],
    say:"I'm an AI engineer based in Bangalore, with over a year building production LLM systems, agentic workflows and RAG pipelines. I've delivered thirty to sixty percent efficiency gains across enterprise deployments. I work across the whole LLM lifecycle — fine-tuning, quantization, evaluation and benchmarking, inference optimisation, and containerised deployment. I'm also a published IEEE researcher in post-training quantization, and an Anthropic Claude Certified Architect." },

  { id:'aigenthix', src:'AiGenthix · Jul 2025 – Present', tags:['aigenthix','current','now','job','role','work','working','doing','present','company','building','build','today','currently'],
    say:"Right now I'm an AI Engineer at AiGenthix Technologies in Bangalore, since July 2025. I've architected and deployed more than five production LLM systems — chatbots, an AI interviewer, an AI receptionist and workflow automation tools — serving enterprise clients end to end." },

  { id:'rag', src:'AiGenthix · RAG architecture', tags:['rag','retrieval','vector','embedding','langchain','search','semantic','relevance'],
    say:"I designed RAG architectures using LangChain, embeddings and vector databases. That improved retrieval accuracy and response relevance by around thirty percent over a keyword baseline. I've worked with FAISS and Chroma for the vector side." },

  { id:'agents', src:'AiGenthix · Multi-agent workflows', tags:['agent','agentic','mcp','a2a','orchestration','tool','multi','protocol','autonomous'],
    say:"I build multi-agent agentic workflows using A2A interaction patterns and MCP, the Model Context Protocol, for structured tool use and agent-to-agent communication. That cut manual effort by about forty percent. I've also developed AI plugins using Claude Code and the Anthropic APIs, so agents can invoke external services autonomously." },

  { id:'eval', src:'AiGenthix · Evaluation', tags:['eval','evaluation','benchmark','test','quality','measure','accuracy','latency'],
    say:"I established LLM evaluation and benchmarking workflows — measuring retrieval quality, output accuracy and latency across model versions before anything ships." },

  { id:'deploy', src:'AiGenthix · Deployment', tags:['deploy','docker','kubernetes','devops','llmops','api','fastapi','rest','scale','production','infrastructure'],
    say:"I develop and integrate REST APIs to expose model endpoints, and deploy containerised AI services using Docker and Kubernetes with CI/CD, built for high-concurrency production loads." },

  { id:'jio', src:'Reliance Jio · Mar – Jun 2025', tags:['jio','reliance','intern','internship','previous','before','earlier'],
    say:"Before AiGenthix I was an ML Engineering Intern at Reliance Jio in Bangalore, from March to June 2025. I built an NLP-based email automation pipeline with intent detection and classifiers, which cut response turnaround time by about fifty percent." },

  { id:'quant', src:'Reliance Jio + IEEE ICIICS-2026', tags:['quantization','quantisation','gptq','awq','gguf','compress','memory','optimis','optimiz','edge','inference','latency','efficient','small','cheap','hardware'],
    say:"Quantization is the work I'm known for. At Jio I fine-tuned TensorFlow and PyTorch transformer models for edge deployment, cutting inference latency by around thirty-five percent and cloud dependency by about forty percent. Applying GPTQ and AWQ quantization gave roughly forty-five percent memory reduction on constrained hardware while holding more than ninety-five percent of baseline accuracy." },

  { id:'ieee', src:'IEEE ICIICS-2026', tags:['ieee','paper','publication','research','published','conference','academic','journal'],
    say:"I have an IEEE conference paper at ICIICS-2026 — the Third International Conference on Integrated Intelligence and Communication Systems. It's titled 'Practical Implementation and Assessment of Post-Training Quantization Methods for Large Language Models'. I benchmarked post-training quantization on Qwen-3, LLaMA-3.2 and GPT-2, achieving about forty percent memory reduction and thirty percent faster inference with under two percent accuracy degradation. The artefacts are open-sourced on Hugging Face." },

  { id:'sahayak', src:'Sahayak AI · Agentic AI Day 2025', tags:['sahayak','award','win','won','hackathon','competition','project','edtech','teacher','teaching','lesson','second','prize','google','hack2skill','lead','team'],
    say:"Sahayak AI is a multi-agent education platform I led, built in March and April 2025. It automates lesson planning, quiz generation and content delivery, and cut teacher preparation time by about sixty percent. It won second place nationally at Agentic AI Day 2025, run by Google Cloud and Hack2Skill." },

  { id:'skills', src:'Résumé — technical skills', tags:['skill','stack','tech','technology','language','framework','tool','python','know','proficient','experience'],
    say:"My core stack is Python and SQL, with PyTorch and TensorFlow for modelling. On the generative side: fine-tuning, RAG, quantization, inference optimisation, evaluation, embeddings and semantic search. For agents: MCP, A2A patterns, tool use and multi-agent orchestration. Frameworks are LangChain, Hugging Face, the OpenAI and Anthropic APIs, Claude Code, AWS Bedrock, Genkit, ADK and FastAPI. Infrastructure is GCP, AWS, Docker, Kubernetes and CI/CD, with FAISS and Chroma for vectors." },

  { id:'education', src:'Résumé — education', tags:['education','degree','study','studied','college','university','mba','engineering','graduate','school','qualification'],
    say:"I did my B.E. in Electronics and Communication Engineering at Sapthagiri College of Engineering in Bangalore, from 2019 to 2023. Then an MBA in Data Analytics and Marketing at IFIM College, from 2023 to 2025. The electronics background is where the interest in running models on constrained hardware comes from, and the MBA is the business side — whether a system is worth running, not just whether it works." },

  { id:'certs', src:'Résumé — certifications', tags:['certification','certified','certificate','anthropic','claude','course','credential'],
    say:"I'm an Anthropic Claude Certified Architect at Foundations level, certified from June 2026. I also hold Generative AI Mastery from OpenAI Academy, a Data Analytics certification from IIT Roorkee, and a Six Sigma White Belt." },

  { id:'contact', src:'Résumé — contact', tags:['contact','email','reach','hire','call','phone','touch','connect','linkedin','github'],
    say:"The fastest way to reach me is email — avi dot hm twenty-four at gmail dot com. My phone is plus nine one, eight nine five one, two two eight zero one eight. I'm on LinkedIn as avinash-hm007 and GitHub as Avinashhmavi." },

  { id:'hobbies', src:'Résumé — interests', tags:['hobby','hobbies','fun','free time','outside','interest','personal','offline','weekend'],
    say:"Outside work I'm into car racing and PC games." },

  { id:'strength', src:'Résumé — summary + record', tags:['strength','best','good at','strongest','why','hire','value','bring','special','different','stand out'],
    say:"The thing I'd point to is that I connect research to production. The quantization work isn't just a paper — it came out of a real edge deployment at Jio, and it runs. And the MBA means I frame things in terms a business can act on. That's why my work tends to be measured in percentages rather than adjectives." }
];

/* Questions the résumé genuinely cannot answer. Until Avinash supplies these,
   the avatar must decline rather than invent. */
export const GAPS = {
  tags:['salary','ctc','compensation','pay','package','lpa','notice','period','relocate','relocation','visa','sponsor','availability','available','join','joining','when can you start','remote','onsite','expectation'],
  say:"That's something I'd rather answer directly than have my avatar guess at — it isn't in my résumé, so I've deliberately not scripted it. Drop me an email at avi.hm24@gmail.com and I'll give you a straight answer.",
  src:'Not in résumé — deliberately not answered'
};

export const FALLBACK = {
  say:"I don't have that in my record, so I won't guess at it. I can tell you about my work at AiGenthix or Reliance Jio, my quantization research, the agentic systems I've built, or my background. What would be most useful?",
  src:'Out of corpus'
};

export const SUGGESTIONS = [
  'Tell me about yourself',
  'What did you do at Reliance Jio?',
  'Explain your quantization research',
  'What are you building right now?',
  'Why should we hire you?'
];
