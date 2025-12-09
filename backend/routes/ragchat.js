const express = require("express");
const router = express.Router();
const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { execSync } = require("child_process");
const path = require("path");

// === Qdrant Client ===
const qdrant = new QdrantClient({ host: "localhost", port: 6333 });

const manualQA = [
  {
    question: "What does HealthShare do?",
    expected_answer:
      "HealthShare is a real-time public health monitoring platform that collects information from tweets, news sources, and online data streams to track disease trends, outbreaks, and health sentiment.",
    reference:
      "HealthShare is a real-time health analytics platform that monitors outbreaks by collecting tweets, news, and health signals."
  },
  {
    question: "How does HealthShare collect real-time tweets?",
    expected_answer:
      "HealthShare uses Twitter’s API to stream tweets containing health-related keywords.",
    reference:
      "HealthShare uses the Twitter streaming API to collect real-time tweets containing health-related keywords."
  },
  {
    question: "What types of data does HealthShare analyze?",
    expected_answer:
      "HealthShare analyzes tweets, news, online reports, and public health signals.",
    reference:
      "HealthShare analyzes tweets, news, online reports, and public health indicators."
  },
  {
    question: "How does HealthShare help users?",
    expected_answer:
      "HealthShare helps users understand real-time disease trends by visualizing spikes, identifying outbreaks, and summarizing public health signals.",
    reference:
      "HealthShare visualizes public health signals to help users track outbreaks and trends."
  }
];



router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  try {
    // === 1. Generate embedding using Python ===
    const escaped = message.replace(/"/g, '\\"');
    const scriptPath = path.join(__dirname, "../embedding/generate_embedding.py");
    const embeddingJSON = execSync(`python3 "${scriptPath}" "${escaped}"`).toString();
    const embedding = JSON.parse(embeddingJSON);

    // === 2. Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === "healthshare");

    let context = "";
    console.log(exists);
    if (exists) {
      
      // === 3. Search Qdrant with fuzzy threshold
      let result = null;

      try {
        // const result = await qdrant.search({
        //   collection_name: "healthshare",
        //   vector: [-0.004993724,0.07262207,0.04805495,-0.045160286,0.0070054615,-0.0024244,0.049860656,0.012373075,-0.06515543,0.014114814,0.05170814,0.007195881,0.05240829,0.027168985,0.01703122,0.030672414,-0.0044047264,-0.0068320227,0.0030816183,-0.006532112,-0.016547812,0.085206255,0.016513798,0.053871576,-0.028837884,-0.09010243,-0.10325926,-0.04190475,-0.03874772,-0.030067,0.0048667337,-0.027762797,-0.027203256,0.044382703,0.01448586,-0.013100628,-0.009237189,0.14869663,-0.064185165,0.033491317,0.0037597576,-0.0045563425,0.034247518,-0.004390602,0.026580717,0.07151388,-0.06808897,0.009099462,0.034161653,0.08465387,-0.08772978,-0.091016084,0.038808033,0.12238143,-0.023654817,-0.11749212,-0.031414635,0.027681137,0.014691635,0.016319523,-0.058454644,0.012879472,0.014717707,-0.013978714,-0.016272992,-0.09352818,0.005410449,0.030921537,0.014417054,-0.0037668871,0.029583773,-0.00084420486,-0.024814514,0.114274964,0.062375348,0.008789978,-0.04248343,-0.036661852,0.13578503,-0.06522323,-0.022188079,-0.07945056,-0.00026174902,0.049683996,-0.001297849,0.027924221,-0.017285004,-0.01924313,0.056871254,-0.010375521,-0.0117528,0.02225232,0.047497585,0.017933551,-0.020445384,-0.021119151,-0.00018748839,-0.04246368,-0.09496564,0.07856129,-0.044270225,-0.071252644,0.028980106,0.0016946866,-0.028774658,-0.00093174214,-0.041641295,-0.02961701,-0.011074931,0.06074176,0.01901811,0.09485985,-0.085933685,-0.0734611,-0.025862694,-0.012255476,0.026914546,-0.017246371,-0.005263822,-0.055341132,-0.042654388,-0.050916784,-0.089259125,-0.0023751103,0.033127524,-0.0125552025,0.102752194,8.784112e-33,-0.0043877913,0.0013299438,0.11360975,0.13098873,0.037406564,-0.0049341405,-0.034861486,0.026164507,-0.006192685,-0.011309522,-0.03205457,-0.03574683,0.020122731,0.013942017,0.00087399286,-0.05965493,-0.017676767,-0.01640781,-0.07027013,0.029839108,0.011187004,-0.041252915,-0.028728213,0.08128964,-0.009193285,0.047676962,0.015265249,0.010379693,0.030519221,0.032568317,-0.010404093,-0.020196885,-0.014742599,-0.054971755,-0.030606244,-0.051601477,-0.0061238464,-0.045897216,-0.05074318,-0.0721268,-0.03878449,0.017544156,0.0025142925,0.019571558,0.005296856,-0.06726713,0.03568169,-0.077691704,0.03263278,0.018508006,0.009159708,0.008590214,-0.03394098,-0.0724981,0.008067134,-0.017460562,-0.009393925,0.055962253,0.04890861,0.009472632,0.10062274,0.033229697,-0.010217776,0.03638557,-0.0019206502,-0.09989482,-0.005714939,-0.109616,-0.014906326,0.0048950324,0.011621894,0.007067309,-0.017331174,-0.015947193,-0.08919108,0.063931204,-0.036208022,0.000010977604,0.04858873,0.0062522152,0.019658023,-0.049366657,-0.051417004,0.06111523,0.06695837,0.040130243,-0.061583217,-0.10689784,-0.032141868,0.06252207,-0.031090962,0.055698015,0.06506466,0.08899618,0.019754367,-1.2298326e-32,-0.057630204,-0.026956338,0.0125682615,0.0071805106,0.054746687,-0.05621902,-0.0030274792,0.01917939,0.031088963,0.0256493,-0.07651458,-0.031567577,-0.038332034,0.08841059,-0.022499451,0.04253381,0.050785493,0.042777143,-0.11163085,0.020948341,-0.08229998,0.05532479,0.085324764,0.11563709,0.020700172,0.024429578,0.082458146,0.076971546,-0.0026346736,-0.05081222,-0.0970114,0.0061189183,0.06949006,0.09153769,-0.11178785,-0.03425914,0.045124087,-0.032904744,0.061239704,-0.042467576,0.09756085,-0.017848855,-0.044386744,-0.011277715,0.009816016,-0.026161658,-0.022845233,0.011381007,0.007111875,0.009601261,0.023697902,0.0011163799,-0.005011138,-0.0357597,-0.013046863,-0.03996154,-0.06271243,-0.12729526,0.014388531,-0.07571665,-0.0034082008,-0.042450335,-0.06123667,0.075354874,0.032642424,0.016631236,-0.032502238,-0.04496248,0.024728784,-0.05483034,0.08066012,-0.026191596,-0.07039663,-0.09318815,-0.03394621,-0.015529484,0.03174856,0.050788112,-0.031060718,-0.0030785922,0.06206207,-0.08530888,-0.027948055,-0.026449163,0.039159667,-0.040650513,0.07148263,-0.03766148,-0.053829923,0.01746846,-0.07354242,-0.05936881,-0.008472844,0.037344273,-0.08417685,-5.4122346e-8,0.11729583,-0.019430306,-0.03369224,-0.043156993,-0.029595044,-0.0027497387,-0.080330566,-0.018619008,0.08585459,0.07375949,-0.014405023,0.13158302,0.05782303,0.07926696,0.06271145,0.013905293,-0.055015497,0.06463391,-0.07900635,0.02319366,-0.017742854,-0.008846208,-0.078709595,0.05499341,0.005817301,0.022830363,-0.014253048,0.036863048,0.009737595,-0.055387873,-0.062427025,0.052315593,-0.103951775,0.0071084215,-0.10303561,0.011337589,0.034320824,-0.06414174,0.008904928,-0.054410126,-0.003394288,0.042759128,-0.013949651,0.013234263,-0.057890993,-0.039660346,-0.008275247,-0.024272507,-0.06150287,-0.012639345,-0.053604905,-0.021645661,0.07501612,0.020601667,-0.10671818,0.018358737,0.027906101,-0.09262812,0.0018658646,-0.03963086,0.09855327,-0.07754215,0.06617629,0.0274495],
        //   limit: 10,
        //   with_payload: true,

        // });

        result = await qdrant.query("healthshare", {
          query: embedding,
          limit: 8,
          with_payload: true,
        });

        console.log("Raw Qdrant response:", result);
        console.log("Payload keys of first result:", result.points[0].payload);
        // searchResult = result.points[0].payload.text;

        // console.log("Qdrant search results:", searchResult);
      } catch (searchErr) {
        console.warn("Qdrant search failed. Falling back to plain LLM. Error:", searchErr.message);
      }

      // === 4. Extract context from search result
      context = result.points.map((point) => point?.payload?.text).join(" ");
      console.log("Combined context:", context);

    }

    // === 5. Build final prompt
    // === 5. Build final prompt with RAG context ===
    const prompt = context && context.length
    ? `You are a helpful assistant. Use the following context to answer the user's question.\n\nContext:\n${context}\n\nUser: ${message}\nAnswer:`
    : `User: ${message}\nAnswer:`;


    // === 6. Call Ollama
    const response = await axios.post("http://127.0.0.1:11434/api/chat", {
      model: "llama3.2",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    res.json({ reply: response.data.message.content });

  } catch (err) {
    console.error("RAG Error:", err.message);
    res.status(500).json({ error: "RAG response failed." });
  }
});

router.post("/debug", async (req, res) => {
  const { message, question } = req.body;
  const userQuestion = question || message;

  if (!userQuestion) {
    return res.status(400).json({
      question: "",
      expected_answer: "",
      answer: "No question provided",
      contexts: []
    });
  }

  // attach manual expected_answer
  const manual = manualQA.find(
    (x) => x.question.toLowerCase() === userQuestion.toLowerCase()
  );

  const expected_answer = manual ? manual.expected_answer : "";

  try {
    // === Embedding ===
    const escaped = userQuestion.replace(/"/g, '\\"');
    const scriptPath = path.join(__dirname, "../embedding/generate_embedding.py");
    const embeddingJSON = execSync(`python3 "${scriptPath}" "${escaped}"`).toString();
    const embedding = JSON.parse(embeddingJSON);

    // === Qdrant Retrieval ===
    let result;
    try {
      result = await qdrant.query("healthshare", {
        query: embedding,
        limit: 5,
        with_payload: true
      });
    } catch (e) {
      result = { points: [] };
    }

    const contexts = (result.points || []).map(
      (p) => p?.payload?.text || ""
    );

    // === Prompt ===
    const prompt = `
Use the following context:
${contexts.join("\n\n")}

Question: ${userQuestion}
Answer:
`;

    // === LLM Answer ===
    let finalAnswer = "LLM failed.";
    try {
      const llm = await axios.post("http://127.0.0.1:11434/api/chat", {
        model: "llama3.2",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      finalAnswer = llm?.data?.message?.content || "LLM returned no content";
    } catch (e) {}

    res.json({
      question: userQuestion,
      expected_answer,
      reference: manual?.reference || "",
      answer: finalAnswer,
      contexts
    });
    

  } catch (e) {
    res.json({
      question: userQuestion,
      expected_answer,
      answer: "Unexpected failure.",
      contexts: []
    });
  }
});



module.exports = router;
