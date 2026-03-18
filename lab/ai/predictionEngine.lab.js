export class PredictionEngine {
  constructor(patternDB) {
    this.patternDB = patternDB;
  }

  predict(pattern) {
    // 1. 같은 type+nodes의 정확한 패턴 찾기
    const exact = this.patternDB.getExact(pattern);

    if (exact) {
      const adjust = exact.weightAdjust || 1;
      const probability = Math.max(
        0,
        Math.min(1, (exact.score || 0.5) * adjust)
      );

      const expectedMove = probability * 6;

      return {
        probability,
        expectedMove
      };
    }

    // 2. 없으면 타입 평균 fallback
    const historical = this.patternDB.getByType(pattern.type);

    if (!historical || historical.length === 0) {
      return {
        probability: Math.min(1, Math.max(0, pattern.score || 0.5)),
        expectedMove: (pattern.score || 0.5) * 4
      };
    }

    let total = 0;
    let count = 0;

    historical.forEach((p) => {
      const adjust = p.weightAdjust || 1;
      total += (p.score || 0.5) * adjust;
      count++;
    });

    const avgScore = count ? total / count : 0.5;
    const probability = Math.max(0, Math.min(1, avgScore));
    const expectedMove = probability * 6;

    return {
      probability,
      expectedMove
    };
  }
}
