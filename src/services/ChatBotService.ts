import { TFIDFVectorizer, normalize, cosineSimilarity, fuzzySim } from '../utils/chatbotLogic';
import intentsData from '../intents.json';

export interface Intent {
  tag: string;
  patterns: string[];
  responses: string[];
}

export interface Prediction {
  tag: string;
  score: number;
}

export class ChatBot {
  private intents: Intent[];
  private vectorizer: TFIDFVectorizer;
  private context: string[] = [];
  private patternDocs: string[] = [];
  private patternTags: string[] = [];
  private X: number[][] = [];

  private THRESHOLD_HIGH = 0.55;
  private THRESHOLD_MEDIUM = 0.30;
  private FUZZY_BOOST = 0.15;
  private CONTEXT_BOOST = 0.10;

  constructor() {
    this.intents = intentsData.intents;
    this.vectorizer = new TFIDFVectorizer(1500);
    this.buildIndex();
  }

  private buildIndex() {
    this.patternDocs = [];
    this.patternTags = [];
    this.intents.forEach(intent => {
      const tag = intent.tag.trim();
      intent.patterns.forEach(pat => {
        this.patternDocs.push(pat);
        this.patternTags.push(tag);
      });
    });
    this.X = this.vectorizer.fitTransform(this.patternDocs);
  }

  private scoreIntents(query: string): Prediction[] {
    const qVec = this.vectorizer.transformOne(query);
    const sims = this.X.map(x => cosineSimilarity(qVec, x));
    const qTokens = new Set(normalize(query).split(' '));
    const tagScores: Map<string, number> = new Map();

    this.patternTags.forEach((tag, i) => {
      let sim = sims[i];
      let score = sim;
      if (sim > 0.5) {
        const patTokens = new Set(normalize(this.patternDocs[i]).split(' '));
        const intersection = new Set([...qTokens].filter(x => patTokens.has(x)));
        const union = new Set([...qTokens, ...patTokens]);
        const jaccard = intersection.size / Math.max(union.size, 1);
        score = Math.min(sim * 0.85 + jaccard * 0.15, 1.0);
      }
      tagScores.set(tag, Math.max(tagScores.get(tag) || 0, score));
    });

    this.patternDocs.forEach((pat, i) => {
      const fz = fuzzySim(query, pat);
      if (fz > 0.70) {
        const tag = this.patternTags[i];
        tagScores.set(tag, Math.min((tagScores.get(tag) || 0) + this.FUZZY_BOOST * fz, 1.0));
      }
    });

    this.context.forEach(tag => {
      if (tagScores.has(tag)) {
        tagScores.set(tag, Math.min((tagScores.get(tag) || 0) + this.CONTEXT_BOOST, 1.0));
      }
    });

    return Array.from(tagScores.entries())
      .map(([tag, score]) => ({ tag, score }))
      .sort((a, b) => b.score - a.score);
  }

  public predict(query: string) {
    const ranked = this.scoreIntents(query);
    if (ranked.length === 0) return { bestTag: 'unknown', bestScore: 0, top3: [] };
    let bestTag = ranked[0].tag;
    let bestScore = ranked[0].score;
    if (ranked.length > 1) {
      const secondTag = ranked[1].tag;
      const secondScore = ranked[1].score;
      if (Math.abs(bestScore - secondScore) < 0.02) {
        const qLen = normalize(query).split(' ').length;
        const getBestPatLenDiff = (tag: string) => {
          const diffs = this.patternTags.map((t, i) => (t === tag ? Math.abs(normalize(this.patternDocs[i]).split(' ').length - qLen) : 999));
          return Math.min(...diffs);
        };
        if (getBestPatLenDiff(secondTag) < getBestPatLenDiff(bestTag)) bestTag = secondTag;
      }
    }
    return { bestTag, bestScore, top3: ranked.slice(0, 3) };
  }

  public getResponse(tag: string): string {
    const intent = this.intents.find(i => i.tag.trim() === tag);
    return intent ? intent.responses[Math.floor(Math.random() * intent.responses.length)] : "";
  }

  public reply(userInput: string): string {
    const { bestTag, bestScore, top3 } = this.predict(userInput);
    if (bestScore >= this.THRESHOLD_HIGH) {
      this.updateContext(bestTag);
      return this.getResponse(bestTag);
    }
    if (bestScore >= this.THRESHOLD_MEDIUM) {
      this.updateContext(bestTag);
      return `${this.getResponse(bestTag)}\n\n*(Bạn có thể nói rõ hơn nếu tôi hiểu chưa đúng nhé!)*`;
    }
    const hints = top3.filter(p => p.score > 0.10).map(p => `• ${this.tagToLabel(p.tag)}`);
    if (hints.length > 0) return "Xin lỗi";
    return "Xin lỗi bạn , chủ nhân của tôi mới chỉ tạo được hơn 100tag và không may câu hỏi của bạn chưa nằm trong đấy , thật lòng chủ nhân của tôi vô cùng đáng tiếc và sẽ bổ sung sau thưa quý khách , mong quý khách thông cảm  .";
  }

  private updateContext(tag: string) {
    this.context.push(tag);
    if (this.context.length > 3) this.context.shift();
  }

  public tagToLabel(tag: string): string {
    const map: Record<string, string> = {
      "greetings": "Chào hỏi", "bye": "Tạm biệt", "thanks": "Cảm ơn", "menu_general": "Thực đơn", "recommendations": "Gợi ý món ăn",
      "reservation_booking": "Đặt bàn", "location_address": "Địa chỉ", "opening_hours": "Giờ mở cửa", "delivery_order": "Giao hàng",
      "payment_methods": "Thanh toán", "discounts_promotions": "Khuyến mãi", "wifi_info": "Wifi", "kids_area": "Trẻ em",
      "steak_info": "Steak", "seafood_info": "Hải sản", "pasta_pizza": "Mì Ý & Pizza", "vegetarian": "Món chay",
      "breakfast": "Đồ ăn sáng", "lunch_combo": "Cơm trưa", "dinner_romantic": "Ăn tối lãng mạn", "appetizers": "Khai vị",
      "desserts": "Tráng miệng", "price_inquiry": "Giá cả", "cheap_options": "Món giá rẻ", "luxury_options": "Món cao cấp",
      "reservation_group": "Đặt tiệc", "reservation_cancel": "Hủy bàn", "parking": "Chỗ để xe", "delivery_time": "Thời gian giao",
      "delivery_fee": "Phí ship", "membership": "Thành viên", "smoking_area": "Hút thuốc", "allergies": "Dị ứng",
      "food_quality_good": "Khen ngợi", "food_quality_bad": "Góp ý món", "service_complaint": "Khiếu nại",
      "birthday_service": "Sinh nhật", "spicy_level": "Độ cay", "takeaway_packaging": "Đóng gói",
      "ingredient_source": "Nguồn gốc", "seasonal_dishes": "Món theo mùa", "cooking_time": "Thời gian nấu",
      "cleanliness": "Vệ sinh", "music_request": "Âm nhạc", "air_conditioner": "Điều hòa", "refund_request": "Hoàn tiền",
      "feedback_general": "Góp ý chung", "human_agent": "Gặp nhân viên", "menu_soup_pumpkin": "Súp bí đỏ",
      "menu_soup_mushroom": "Súp nấm", "menu_salad_caesar": "Salad Caesar", "menu_steak_ribeye": "Steak Ribeye",
      "menu_steak_tenderloin": "Thăn nội bò", "menu_salmon_panseared": "Cá hồi áp chảo", "menu_pasta_carbonara": "Mì Ý Carbonara",
      "menu_pizza_seafood": "Pizza hải sản", "menu_pizza_cheese": "Pizza phô mai", "drink_mojito": "Mojito",
      "drink_red_wine": "Vang đỏ", "drink_white_wine": "Vang trắng", "request_no_onion": "Không hành",
      "request_no_msg": "Không mì chính", "request_less_salt": "Ăn nhạt", "request_extra_sauce": "Thêm sốt",
      "complaint_hair": "Vật lạ", "complaint_wrong_order": "Nhầm món", "complaint_cold_food": "Đồ ăn nguội",
      "ask_vat_invoice": "Hóa đơn VAT", "ask_baby_chair": "Ghế trẻ em", "ask_private_room": "Phòng VIP",
      "ask_parking_truck": "Đỗ xe lớn", "ask_wheelchair": "Xe lăn", "ask_corkage_fee": "Phí mang rượu",
      "event_anniversary": "Kỷ niệm", "event_proposal": "Cầu hôn", "ask_takeaway_box": "Hộp mang về"
    };
    return map[tag] || tag;
  }
}
