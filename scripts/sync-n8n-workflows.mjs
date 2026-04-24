import fs from "node:fs";
import path from "node:path";

const chatFlowPath = path.resolve("n8n", "Teacher Assistant Conversational Flow.json");
const labFlowPath = path.resolve("n8n", "Teacher Assistant Lab Flow.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getNode(flow, name) {
  const node = flow.nodes.find((entry) => entry.name === name);
  if (!node) {
    throw new Error(`Node not found: ${name}`);
  }
  return node;
}

const chatProviderPayloadCode = `const source = $json || {};

const providerSystemPrompt = 'Eres un asistente docente experto en diseño de actividades didacticas claras, aplicables y con buena calidad pedagogica. Devuelve solo JSON minificado en una sola linea con una clave activity. activity debe incluir exactamente: title, objective, materials, steps, closure y assessment. Si profile ya trae stage, subject o duration, usalos para ajustar el nivel, el lenguaje y la complejidad. La actividad debe ser concreta, realista y lista para usar en aula. title: especifico y atractivo, no generico. objective: una frase clara que explique que aprendera el alumnado y para que. materials: maximo 6 elementos reales y utiles. steps: entre 4 y 6 pasos, cada uno con suficiente detalle operativo para que el docente sepa que hacer, que decir o que producto pedir; evita pasos vagos como introducir o discutir sin concretar. closure: indica como cerrar la actividad y consolidar el aprendizaje. assessment: entre 1 y 3 evidencias observables o comprobaciones concretas. Prioriza propuestas activas, comprensibles y ajustadas al tiempo disponible. No devuelvas markdown ni texto fuera del JSON.';

const providerRequestBodyText = JSON.stringify({
  model: source.config?.lmModel,
  temperature: 0.35,
  max_tokens: 2200,
  stream: false,
  messages: [
    {
      role: 'system',
      content: providerSystemPrompt
    },
    {
      role: 'user',
      content: JSON.stringify({
        sessionId: source.sessionId,
        requestedAt: source.requestedAt,
        profile: source.profile,
        message: source.message
      })
    }
  ]
});

return [{
  json: {
    ...source,
    providerSystemPrompt,
    providerRequestBodyText
  }
}];`;

const chatGenerateJsonBody = "={{ $json.providerRequestBodyText }}";

const chatBuildResponse = `const current = $json || {};
const source = $("AI Config1").item.json;

function clean(value) {
  return String(value ?? '').replace(/\\s+/g, ' ').trim();
}

function normalized(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase();
}

function pick(sourceObject, keys) {
  if (!sourceObject || typeof sourceObject !== 'object' || Array.isArray(sourceObject)) return '';
  for (const key of keys) {
    const value = sourceObject[key];
    if (value !== undefined && value !== null && clean(value)) return value;
  }
  return '';
}

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function closeOpenJson(text) {
  let inString = false;
  let escaped = false;
  let curly = 0;
  let square = 0;

  for (const char of text) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') curly += 1;
    if (char === '}') curly = Math.max(0, curly - 1);
    if (char === '[') square += 1;
    if (char === ']') square = Math.max(0, square - 1);
  }

  let fixed = text;
  if (inString) fixed += '"';
  fixed += ']'.repeat(square);
  fixed += '}'.repeat(curly);
  return fixed;
}

function parseJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text
    .trim()
    .replace(/^\\\`\\\`\\\`json\\s*/i, '')
    .replace(/^\\\`\\\`\\\`\\s*/i, '')
    .replace(/\\s*\\\`\\\`\\\`$/i, '')
    .trim();

  const direct = tryParseJson(trimmed);
  if (direct) return direct;

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const parsedObject = tryParseJson(trimmed.slice(firstBrace, lastBrace + 1));
    if (parsedObject) return parsedObject;
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const parsedArray = tryParseJson(trimmed.slice(firstBracket, lastBracket + 1));
    if (parsedArray) return parsedArray;
  }

  const repaired = closeOpenJson(trimmed);
  if (repaired !== trimmed) {
    const repairedDirect = tryParseJson(repaired);
    if (repairedDirect) return repairedDirect;

    const repairedFirstBrace = repaired.indexOf('{');
    const repairedLastBrace = repaired.lastIndexOf('}');
    if (repairedFirstBrace !== -1 && repairedLastBrace !== -1 && repairedLastBrace > repairedFirstBrace) {
      const repairedObject = tryParseJson(repaired.slice(repairedFirstBrace, repairedLastBrace + 1));
      if (repairedObject) return repairedObject;
    }
  }

  return null;
}

function normalizeStage(value) {
  const text = normalized(value);
  if (!text) return '';
  if (/infantil|preescolar/.test(text)) return 'Infantil';
  if (/primaria/.test(text)) return 'Primaria';
  if (/secundaria/.test(text)) return 'Secundaria';
  if (/bachillerato/.test(text)) return 'Bachillerato';
  return clean(value);
}

function normalizeSubject(value) {
  const text = normalized(value);
  if (!text) return '';
  if (/educacion fisica|ed\\.? fisica/.test(text)) return 'Ed. Fisica';
  if (/matematic/.test(text)) return 'Matematicas';
  if (/lengua|lenguaje/.test(text)) return 'Lengua';
  if (/ciencias?/.test(text)) return 'Ciencias';
  if (/historia/.test(text)) return 'Historia';
  if (/ingles/.test(text)) return 'Ingles';
  if (/musica/.test(text)) return 'Musica';
  if (/arte/.test(text)) return 'Arte';
  return clean(value);
}

function normalizeDuration(value) {
  const text = normalized(value);
  if (!text) return '';
  const match = text.match(/\\b(\\d{1,3})\\s*(min|minutos|hora|horas)\\b/);
  if (!match) return clean(value);
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return clean(value);
  if (match[2].startsWith('hora')) return amount === 1 ? '1 hora' : \`\${amount} horas\`;
  return \`\${amount} min\`;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return clean(item);
        if (item && typeof item === 'object') {
          return clean(
            item.instruction ||
            item.description ||
            item.text ||
            item.name ||
            item.title
          );
        }
        return clean(item);
      })
      .filter(Boolean);
  }
  if (value && typeof value === 'object') {
    return toArray([
      value.instruction ||
      value.description ||
      value.text ||
      value.name ||
      value.title
    ]);
  }
  const text = clean(value);
  return text ? [text] : [];
}

function normalizeActivity(activity) {
  const safe = activity && typeof activity === 'object' ? activity : {};
  return {
    title: clean(pick(safe, ['title', 'taskTitle', 'name', 'activityTitle', 'activity_name'])),
    objective: clean(pick(safe, ['objective', 'goal', 'description', 'purpose', 'meta'])),
    materials: toArray(pick(safe, ['materials', 'resources_required', 'resources', 'materiales', 'recursos'])),
    steps: toArray(pick(safe, ['steps', 'instructions', 'pasos', 'dynamic', 'development'])),
    closure: clean(pick(safe, ['closure', 'conclusion', 'cierre', 'finish'])),
    assessment: toArray(pick(safe, ['assessment', 'evaluation', 'evaluacion', 'grading'])),
    passage: clean(pick(safe, ['passage', 'text', 'reading', 'lectura'])),
    questions: Array.isArray(safe.questions) ? safe.questions : safe.questions ? toArray(safe.questions) : undefined,
    difficulty_level: clean(pick(safe, ['difficulty_level', 'level', 'nivel', 'difficulty']))
  };
}

function inferTopic(text, subject) {
  const safeText = normalized(text);
  if (/fraccion/.test(safeText)) return 'fracciones';
  if (/lectura/.test(safeText)) return 'lectura guiada';
  if (/ciclo del agua/.test(safeText)) return 'ciclo del agua';
  return clean(subject) ? \`contenidos de \${subject}\` : 'contenido de clase';
}

function buildFallbackActivity(profile, text) {
  const topic = inferTopic(text, profile.subject);
  return {
    title: \`Actividad de \${profile.subject || 'clase'}: \${topic}\`,
    objective: \`Trabajar \${topic} con una propuesta breve, clara y aplicable al aula.\`,
    materials: ['Papel y lapiz', 'Pizarra o soporte visual simple'],
    steps: [
      \`Presenta un ejemplo breve sobre \${topic} conectandolo con el contexto del grupo.\`,
      'Guia una practica corta con una consigna concreta y comprueba la comprension antes de cerrar.',
      'Cierra con una verificacion oral rapida y una aplicacion individual o en parejas.'
    ],
    closure: 'Recoge una idea final del grupo y conecta el aprendizaje con la siguiente sesion.',
    assessment: ['Observar si siguen la consigna y si aplican el contenido con apoyo minimo.']
  };
}

function summarizeRaw(raw) {
  const text = clean(raw);
  return text ? text.slice(0, 800) : '';
}

function summarizeError(value) {
  if (!value) return '';
  if (typeof value === 'string') return clean(value).slice(0, 800);
  try {
    return JSON.stringify(value).slice(0, 800);
  } catch (error) {
    return clean(String(value)).slice(0, 800);
  }
}

function extractProviderPayload(payload) {
  const contentCandidates = [
    ['choices[0].message.content', payload?.choices?.[0]?.message?.content],
    ['data.choices[0].message.content', payload?.data?.choices?.[0]?.message?.content],
    ['body.choices[0].message.content', payload?.body?.choices?.[0]?.message?.content],
    ['body.data.choices[0].message.content', payload?.body?.data?.choices?.[0]?.message?.content],
    ['message', typeof payload?.message === 'string' ? payload.message : '']
  ];

  for (const [location, value] of contentCandidates) {
    if (typeof value === 'string' && clean(value)) {
      return {
        rawContent: value,
        rawToolArguments: '',
        payloadLocation: location
      };
    }
  }

  const toolArgumentCandidates = [
    ['choices[0].message.tool_calls[0].function.arguments', payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments],
    ['data.choices[0].message.tool_calls[0].function.arguments', payload?.data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments],
    ['body.choices[0].message.tool_calls[0].function.arguments', payload?.body?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments],
    ['body.data.choices[0].message.tool_calls[0].function.arguments', payload?.body?.data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments]
  ];

  for (const [location, value] of toolArgumentCandidates) {
    if (typeof value === 'string' && clean(value)) {
      return {
        rawContent: '',
        rawToolArguments: value,
        payloadLocation: location
      };
    }
  }

  return {
    rawContent: '',
    rawToolArguments: '',
    payloadLocation: ''
  };
}

const invalidBranch = !source.shouldCallModel;
const providerPayload = extractProviderPayload(current);
const raw = providerPayload.rawContent || providerPayload.rawToolArguments;
const providerPayloadLocation = providerPayload.payloadLocation;
const parsed = parseJson(raw);
const providerHttpStatus = typeof current?.statusCode === 'number' ? current.statusCode : null;
const providerCallAttempted = Boolean(source.shouldCallModel);
const providerTransportFailed = Boolean(current.error || (providerHttpStatus !== null && providerHttpStatus >= 400));
const parsedRoot = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
const candidateActivity = parsedRoot.activity && typeof parsedRoot.activity === 'object'
  ? parsedRoot.activity
  : parsed;
const activity = normalizeActivity(candidateActivity);
const validActivity = Boolean(activity.title && activity.objective && activity.steps.length > 0);
const profile = {
  stage: source.profile.stage || normalizeStage(parsedRoot.stage || parsedRoot?.profile?.stage),
  subject: source.profile.subject || normalizeSubject(parsedRoot.subject || parsedRoot?.profile?.subject),
  duration: source.profile.duration || normalizeDuration(parsedRoot.duration || parsedRoot?.profile?.duration)
};

let providerFailureReason = '';
if (!invalidBranch) {
  if (providerTransportFailed) {
    providerFailureReason = clean(current?.error?.message || current?.message || (providerHttpStatus ? \`LM Studio respondio con HTTP \${providerHttpStatus}.\` : 'LM Studio no respondio correctamente.'));
  } else if (!clean(raw)) {
    providerFailureReason = 'LM Studio devolvio contenido vacio.';
  } else if (!parsed) {
    providerFailureReason = 'LM Studio devolvio contenido no JSON.';
  } else if (!validActivity) {
    providerFailureReason = 'LM Studio devolvio JSON, pero la actividad estaba incompleta.';
  }
}

const usedFallback = !invalidBranch && Boolean(providerFailureReason);
const aiProviderStatus = invalidBranch
  ? 'lmstudio_failed'
  : usedFallback
    ? 'degraded_fallback'
    : 'lmstudio_ok';

let responsePayload;
if (invalidBranch) {
  responsePayload = {
    type: source.validationType,
    message: source.validationMessage,
    missingFields: source.missingFields,
    profile,
    activity: null,
    aiProviderStatus,
    usedFallback: false,
    responseDiagnostics: {
      providerCallAttempted,
      providerHttpStatus,
      providerPayloadLocation,
      providerRawContent: summarizeRaw(raw),
      providerEndpoint: source.config.lmStudioUrl,
      providerModel: source.config.lmModel,
      providerErrorMessage: summarizeError(current?.error || current?.message || current?.reason)
    }
  };
} else {
  const finalActivity = usedFallback
    ? buildFallbackActivity(profile, source.message)
    : activity;

  responsePayload = {
    type: 'final_activity',
    message: usedFallback
      ? 'Actividad generada con fallback controlado porque LM Studio no devolvio un resultado utilizable.'
      : 'Actividad generada correctamente.',
    missingFields: [],
    profile,
    activity: finalActivity,
    aiProviderStatus,
    usedFallback,
    providerFailureReason: usedFallback ? providerFailureReason : undefined,
    responseDiagnostics: {
      providerCallAttempted,
      providerHttpStatus,
      providerPayloadLocation,
      providerRawContent: summarizeRaw(raw),
      providerEndpoint: source.config.lmStudioUrl,
      providerModel: source.config.lmModel,
      providerErrorMessage: summarizeError(current?.error || current?.message || current?.reason)
    }
  };
}

const shouldPersist = Boolean(clean(source.sessionId));
const persistencePayload = shouldPersist
  ? {
      session_id: source.sessionId,
      profile,
      last_activity: responsePayload.type === 'final_activity' ? responsePayload.activity : {},
      conversation_state: responsePayload.type === 'final_activity' ? 'generated' : 'collecting_info'
    }
  : null;

return [{ json: { responsePayload, persistencePayload, shouldPersist } }];`;

const chatFormatResponse = `const base = $("Build Chat Response1").item.json.responsePayload;
const current = $json || {};
const cameDirect = Object.prototype.hasOwnProperty.call(current, 'responsePayload');
if (cameDirect) {
  return [{ json: base }];
}

const persistenceFailed = Boolean(
  current.error ||
  current.code ||
  (typeof current.statusCode === 'number' && current.statusCode >= 400)
);

if (!persistenceFailed) {
  return [{ json: base }];
}

return [{
  json: {
    ...base,
    message: \`\${base.message} No se pudo guardar la sesion en Supabase.\`,
    responseDiagnostics: {
      ...(base.responseDiagnostics || {}),
      persistenceFailed: true
    }
  }
}];`;

const labBuildResponse = `const current = $json || {};
const source = $("AI Config1").item.json;

function clean(value) {
  return String(value ?? '').replace(/\\s+/g, ' ').trim();
}

function normalized(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase();
}

function parseJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^\\\`\\\`\\\`json\\s*/i, '').replace(/^\\\`\\\`\\\`\\s*/i, '').replace(/\\s*\\\`\\\`\\\`$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {}
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch (error) {}
  }
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    } catch (error) {}
  }
  return null;
}

function normalizeProbability(value) {
  const text = normalized(value);
  if (!text) return '';
  if (/alta/.test(text)) return 'Alta';
  if (/media/.test(text)) return 'Media';
  if (/baja/.test(text)) return 'Baja';
  return clean(value);
}

function buildFallback(action, activity, context) {
  if (action === 'expert_debate') {
    return [
      {
        expert: 'Didactica Activa',
        role: 'Especialista en aprendizaje activo',
        pros: \`La actividad \${activity.title} tiene potencial para conectar con \${context.subject || 'el contenido'} desde una tarea concreta.\`,
        cons: 'Puede quedarse corta si no se explicitan criterios de exito y cierre observable.'
      },
      {
        expert: 'Atencion a la Diversidad',
        role: 'Especialista en inclusion',
        pros: 'Permite introducir apoyos visuales o andamiaje sin cambiar la esencia de la propuesta.',
        cons: 'Necesita prever ritmos distintos y una instruccion inicial mas fragmentada.'
      },
      {
        expert: 'Evaluacion Formativa',
        role: 'Especialista en evaluacion autentica',
        pros: 'Se presta a una verificacion rapida del aprendizaje si se define un producto final simple.',
        cons: 'Sin evidencia observable, el docente puede confundir actividad atractiva con aprendizaje real.'
      }
    ];
  }

  if (action === 'stress_test') {
    return {
      score: 68,
      risks: [
        {
          event: 'La consigna inicial no queda suficientemente concreta para todo el grupo.',
          probability: 'Alta',
          extinguisher: 'Modelar un ejemplo resuelto y comprobar comprension antes de soltar la tarea.'
        },
        {
          event: 'El tiempo se consume en transiciones o reparto de materiales.',
          probability: 'Media',
          extinguisher: 'Preparar materiales por estaciones o roles antes de iniciar la actividad.'
        }
      ]
    };
  }

  if (action === 'curriculum_mapping') {
    return \`## Encaje curricular\\n\\n- **Actividad:** \${activity.title}\\n- **Area:** \${context.subject || 'Pendiente de concretar'}\\n- **Etapa:** \${context.stage || 'Pendiente de concretar'}\\n\\n### Lectura rapida\\nLa propuesta es compatible con una formulacion competencial si se explicitan saberes, criterio de evaluacion y producto observable.\\n\\n### Recomendacion\\nAñadir una evidencia final breve y un criterio de exito que pueda observarse en aula.\`;
  }

  if (action === 'parent_summary') {
    return \`### Resumen para familias\\n\\nHoy trabajaremos **\${activity.title}** con una actividad breve y guiada. El objetivo es que el alumnado practique de forma clara y participe con seguridad.\\n\\nSi queréis reforzarlo en casa, basta con pedirles que os expliquen con sus palabras que han hecho y que han aprendido.\`;
  }

  return {
    elephant: 'La actividad puede estar mejor explicada que estructurada para demostrar aprendizaje.',
    bias: 'Puede asumir que todo el grupo responde igual al mismo ritmo y al mismo tipo de instruccion.',
    placebo_effect: 'Una dinamica atractiva puede dar sensacion de exito sin evidencia clara de comprension.',
    suggestion: 'Definir una evidencia final observable y un apoyo especifico para quien necesite mas andamiaje.'
  };
}

function summarizeRaw(raw) {
  const text = clean(raw);
  return text ? text.slice(0, 800) : '';
}

function summarizeError(value) {
  if (!value) return '';
  if (typeof value === 'string') return clean(value).slice(0, 800);
  try {
    return JSON.stringify(value).slice(0, 800);
  } catch (error) {
    return clean(String(value)).slice(0, 800);
  }
}

const providerCallAttempted = Boolean(source.shouldCallModel);
const providerHttpStatus = typeof current?.statusCode === 'number' ? current.statusCode : null;
const raw = current?.choices?.[0]?.message?.content
  ?? current?.data?.choices?.[0]?.message?.content
  ?? (typeof current?.message === 'string' ? current.message : '');
const providerTransportFailed = Boolean(current.error || (providerHttpStatus !== null && providerHttpStatus >= 400));

if (!source.shouldCallModel) {
  return [{
    json: {
      ...source.validationResponse,
      aiProviderStatus: 'lmstudio_failed',
      usedFallback: false,
      responseDiagnostics: {
        providerCallAttempted,
        providerHttpStatus,
        providerRawContent: summarizeRaw(raw),
      providerEndpoint: source.config.lmStudioUrl,
      providerModel: source.config.lmModel,
      providerErrorMessage: summarizeError(current?.error || current?.message || current?.reason)
      }
    }
  }];
}

let providerFailureReason = '';
if (providerTransportFailed) {
  providerFailureReason = clean(current?.error?.message || current?.message || (providerHttpStatus ? \`LM Studio respondio con HTTP \${providerHttpStatus}.\` : 'LM Studio no respondio correctamente.'));
} else if (!clean(raw)) {
  providerFailureReason = 'LM Studio devolvio contenido vacio.';
}

if (source.actionConfig.mode === 'markdown') {
  const text = clean(raw);
  const usedFallback = Boolean(providerFailureReason || !text);
  const data = usedFallback
    ? buildFallback(source.action, source.activity, source.context)
    : raw;
  return [{
    json: {
      ok: true,
      type: source.action,
      data,
      message: usedFallback
        ? 'Operation completed with degraded fallback.'
        : 'Operation completed successfully.',
      aiProviderStatus: usedFallback ? 'degraded_fallback' : 'lmstudio_ok',
      usedFallback,
      providerFailureReason: usedFallback ? (providerFailureReason || 'LM Studio devolvio markdown vacio.') : undefined,
      responseDiagnostics: {
        providerCallAttempted,
        providerHttpStatus,
        providerRawContent: summarizeRaw(raw),
      providerEndpoint: source.config.lmStudioUrl,
      providerModel: source.config.lmModel,
      providerErrorMessage: summarizeError(current?.error || current?.message || current?.reason)
      }
    }
  }];
}

const parsed = parseJson(raw);
let data = parsed;
let fallbackUsed = false;

if (!providerFailureReason && !parsed) {
  providerFailureReason = 'LM Studio devolvio contenido no JSON.';
}

if (source.action === 'expert_debate') {
  const valid = Array.isArray(parsed) && parsed.length > 0 && parsed.every((item) => item && typeof item === 'object' && clean(item.role) && clean(item.pros) && clean(item.cons));
  if (!valid) {
    data = buildFallback(source.action, source.activity, source.context);
    fallbackUsed = true;
    providerFailureReason = providerFailureReason || 'LM Studio devolvio un debate invalido.';
  }
}

if (source.action === 'stress_test') {
  const valid = parsed && typeof parsed === 'object' && Number.isFinite(Number(parsed.score)) && Array.isArray(parsed.risks);
  if (!valid) {
    data = buildFallback(source.action, source.activity, source.context);
    fallbackUsed = true;
    providerFailureReason = providerFailureReason || 'LM Studio devolvio un stress test invalido.';
  } else {
    data = {
      score: Number(parsed.score),
      risks: parsed.risks.map((risk) => ({
        event: clean(risk?.event),
        probability: normalizeProbability(risk?.probability),
        extinguisher: clean(risk?.extinguisher)
      })).filter((risk) => risk.event && risk.probability && risk.extinguisher)
    };
    if (!data.risks.length) {
      data = buildFallback(source.action, source.activity, source.context);
      fallbackUsed = true;
      providerFailureReason = providerFailureReason || 'LM Studio devolvio riesgos vacios o incompletos.';
    }
  }
}

if (source.action === 'critic_mirror') {
  const valid = parsed && typeof parsed === 'object' && clean(parsed.elephant) && clean(parsed.bias) && clean(parsed.placebo_effect) && clean(parsed.suggestion);
  if (!valid) {
    data = buildFallback(source.action, source.activity, source.context);
    fallbackUsed = true;
    providerFailureReason = providerFailureReason || 'LM Studio devolvio un critic mirror invalido.';
  } else {
    data = {
      elephant: clean(parsed.elephant),
      bias: clean(parsed.bias),
      placebo_effect: clean(parsed.placebo_effect),
      suggestion: clean(parsed.suggestion)
    };
  }
}

const usedFallback = Boolean(providerFailureReason || fallbackUsed);
return [{
  json: {
    ok: true,
    type: source.action,
    data,
    message: usedFallback
      ? 'Operation completed with degraded fallback.'
      : 'Operation completed successfully.',
    aiProviderStatus: usedFallback ? 'degraded_fallback' : 'lmstudio_ok',
    usedFallback,
    providerFailureReason: usedFallback ? providerFailureReason : undefined,
    responseDiagnostics: {
      providerCallAttempted,
      providerHttpStatus,
      providerRawContent: summarizeRaw(raw),
      providerEndpoint: source.config.lmStudioUrl,
      providerModel: source.config.lmModel,
      providerErrorMessage: summarizeError(current?.error || current?.message || current?.reason)
    }
  }
}];`;

function updateHttpNode(node) {
  const headers = node.parameters.headerParameters?.parameters || [];
  const hasAccept = headers.some((header) => header.name === "Accept");
  if (!hasAccept) {
    headers.push({ name: "Accept", value: "application/json" });
  }
  node.parameters.headerParameters = { parameters: headers };
}

function syncChatFlow() {
  const flow = readJson(chatFlowPath);
  getNode(flow, "Build Provider Payload1").parameters.jsCode = chatProviderPayloadCode;
  getNode(flow, "Generate Activity1").parameters.jsonBody = chatGenerateJsonBody;
  getNode(flow, "Build Chat Response1").parameters.jsCode = chatBuildResponse;
  getNode(flow, "Format Response1").parameters.jsCode = chatFormatResponse;
  updateHttpNode(getNode(flow, "Generate Activity1"));
  writeJson(chatFlowPath, flow);
}

function syncLabFlow() {
  const flow = readJson(labFlowPath);
  getNode(flow, "Build Lab Response1").parameters.jsCode = labBuildResponse;
  updateHttpNode(getNode(flow, "Call LM Studio1"));
  writeJson(labFlowPath, flow);
}

syncChatFlow();
syncLabFlow();

console.log("n8n workflow exports synchronized.");
