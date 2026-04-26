// ingestion.lab/eventGenerator.lab.js
export class EventGenerator {
  constructor(engine){
    this.engine = engine;
    this.counter = 0;
  }

  generateFromText(text){
    const id = `EVT-TEST-${Date.now()}-${++this.counter}`;
    // very naive parse
    const label = text;
    const time = new Date().toISOString();
    const ticker = (text.match(/\b[A-Z]{2,5}\b/)||[])[0] || "GEN";
    const sentiment = text.toLowerCase().includes("surge") ? "bullish" : (text.toLowerCase().includes("drop") ? "bearish" : "neutral");
    const evt = { id, label, time, ticker, sentiment, confidence: 0.6 };
    return evt;
  }
}
