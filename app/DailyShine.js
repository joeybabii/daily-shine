'use client';
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./lib/AuthProvider";
import { loadUserData, saveUserData, getLocalData, writeToLocal } from "./lib/cloudStorage";

// Storage helpers — always writes to localStorage, also syncs to cloud when logged in
const storage = {
  _cloudSyncTimer: null,
  _userId: null,

  setUserId(id) { this._userId = id; },

  async get(key) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? { value: val } : null;
    } catch { return null; }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      // Debounced cloud sync
      if (this._userId) {
        clearTimeout(this._cloudSyncTimer);
        this._cloudSyncTimer = setTimeout(() => {
          const allData = getLocalData();
          if (allData) saveUserData(this._userId, allData);
        }, 2000); // Sync 2 seconds after last write
      }
      return { key, value };
    } catch { return null; }
  },

  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch { return null; }
  }
};

const AFFIRMATIONS = [
  "You are exactly where you need to be right now.",
  "Your energy is a gift to everyone around you.",
  "You don't have to be perfect to be worthy.",
  "Small steps still move you forward.",
  "You are allowed to take up space.",
  "Today is full of potential, and so are you.",
  "Your feelings are valid, even the messy ones.",
  "You've survived 100% of your hardest days.",
  "Growth looks different for everyone. Honor your pace.",
  "You are more resilient than you realize.",
  "The world needs what only you can offer.",
  "It's okay to rest. You are not a machine.",
  "You deserve the same kindness you give others.",
  "Every breath is a fresh start.",
  "You are not your worst moment.",
  "Progress, not perfection.",
  "Your presence matters more than your productivity.",
  "You are learning, and that counts for everything.",
  "Let go of what you can't control.",
  "You are enough, right now, as you are.",
  "Difficult roads often lead to beautiful destinations.",
  "You carry light even on your darkest days.",
  "Be gentle with yourself. You're doing your best.",
  "Joy is not something you earn. It's something you allow.",
  "The fact that you're trying says everything.",
  "You don't owe anyone an explanation for choosing yourself.",
  "Your story isn't over. Keep writing.",
  "Healing isn't linear, and that's okay.",
  "You are braver than you believe.",
  "Today, choose to be your own best friend."
];

const CHALLENGES = [
  { text: "Text someone you appreciate and tell them why", icon: "💬", category: "connection" },
  { text: "Take a 10-minute walk without your phone", icon: "🚶", category: "mindfulness" },
  { text: "Write down 3 things you're proud of this week", icon: "✍️", category: "reflection" },
  { text: "Give a genuine compliment to a stranger", icon: "🌟", category: "kindness" },
  { text: "Put on your favorite song and dance for 2 minutes", icon: "🎵", category: "joy" },
  { text: "Drink a full glass of water right now", icon: "💧", category: "self-care" },
  { text: "Spend 5 minutes tidying one small area", icon: "✨", category: "environment" },
  { text: "Say no to one thing that drains your energy today", icon: "🛡️", category: "boundaries" },
  { text: "Look in the mirror and say something kind to yourself", icon: "🪞", category: "self-love" },
  { text: "Write a thank-you note (digital or physical)", icon: "📝", category: "gratitude" },
  { text: "Take 5 slow, deep breaths right now", icon: "🌬️", category: "calm" },
  { text: "Share a meal or coffee with someone you care about", icon: "☕", category: "connection" },
  { text: "Unfollow one account that makes you feel bad", icon: "📱", category: "boundaries" },
  { text: "Do something creative for 15 minutes — draw, write, sing", icon: "🎨", category: "expression" },
  { text: "Hold the door for the next person you see", icon: "🚪", category: "kindness" },
  { text: "Stretch your body for 5 minutes", icon: "🧘", category: "self-care" },
  { text: "Watch the sunset or sunrise today", icon: "🌅", category: "presence" },
  { text: "Tell someone a joke or funny story", icon: "😄", category: "joy" },
  { text: "Write a letter to your future self", icon: "💌", category: "reflection" },
  { text: "Eat one meal slowly and without screens", icon: "🍽️", category: "mindfulness" },
  { text: "Forgive yourself for one small mistake today", icon: "🕊️", category: "self-love" },
  { text: "Learn one new fact about something you're curious about", icon: "🧠", category: "growth" },
  { text: "Leave a kind review for a local business", icon: "⭐", category: "kindness" },
  { text: "Spend 10 minutes in silence — no music, no screens", icon: "🤫", category: "calm" },
  { text: "Cook or prepare something nourishing for yourself", icon: "🥗", category: "self-care" },
  { text: "Call someone instead of texting them", icon: "📞", category: "connection" },
  { text: "Donate or declutter one item you no longer need", icon: "📦", category: "environment" },
  { text: "Smile at 5 people today", icon: "😊", category: "kindness" },
  { text: "Write down your biggest worry, then let it go for today", icon: "🎈", category: "release" },
  { text: "Do one thing you've been putting off for 10 minutes", icon: "⏰", category: "growth" }
];

const GRATITUDE_PROMPTS = [
  "What's one thing that made you smile recently?",
  "Name a person who made your life better this year.",
  "What's a small comfort you're grateful for today?",
  "What's something beautiful you noticed recently?",
  "What's a skill or ability you're thankful to have?",
  "What's a memory that always warms your heart?",
  "What's something in your home that brings you joy?",
  "Who believed in you when you needed it most?",
  "What's a challenge that taught you something valuable?",
  "What's one thing about today that you wouldn't trade?",
  "What sound do you love hearing?",
  "What's a simple pleasure you experienced this week?",
  "What part of your daily routine do you actually enjoy?",
  "What's something you accomplished that once felt impossible?",
  "What's a place that makes you feel at peace?",
];

const QUOTES = [
  { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
];

const MOODS = [
  { emoji: "😢", label: "Rough", value: 1, color: "#8B95A2" },
  { emoji: "😕", label: "Low", value: 2, color: "#A8B4C0" },
  { emoji: "😐", label: "Okay", value: 3, color: "#C4A882" },
  { emoji: "🙂", label: "Good", value: 4, color: "#D4A574" },
  { emoji: "😊", label: "Great", value: 5, color: "#E8976B" },
];

const GUIDES = [
  {
    id: "negative-self-talk", title: "Quieting Negative Self-Talk", icon: "🧠", category: "mindset", time: "5 min",
    preview: "Learn to recognize and redirect the inner critic that holds you back.",
    content: [
      { type: "intro", text: "That voice in your head that says you're not good enough? It's loud, but it's not the truth. Here's how to turn down its volume." },
      { type: "step", num: 1, title: "Name It", text: "Give your inner critic a silly name — like 'Debbie Downer' or 'The Gremlin.' This creates distance between you and the thought. It's not YOU talking, it's just The Gremlin again." },
      { type: "step", num: 2, title: "Catch the Pattern", text: "Notice trigger words: 'always,' 'never,' 'should,' 'can't.' These absolutes are almost never true. When you hear them, pause." },
      { type: "step", num: 3, title: "Talk to Yourself Like a Friend", text: "Ask: 'Would I say this to someone I love?' If the answer is no, you don't deserve to hear it either. Rewrite the thought as if you're advising a close friend." },
      { type: "step", num: 4, title: "The 5-5-5 Test", text: "Will this matter in 5 minutes? 5 months? 5 years? Most negative thoughts fail this test completely." },
      { type: "tip", text: "Progress isn't silencing the critic forever — it's getting faster at recognizing when it's lying to you." }
    ]
  },
  {
    id: "5min-mindfulness", title: "5-Minute Mindfulness Reset", icon: "🧘", category: "calm", time: "5 min",
    preview: "A quick grounding practice you can do anywhere, anytime.",
    content: [
      { type: "intro", text: "You don't need a meditation cushion or an hour of free time. Five minutes of presence can shift your entire day." },
      { type: "step", num: 1, title: "Arrive", text: "Stop what you're doing. Feel your feet on the ground. Feel the weight of your body in your chair. You're here." },
      { type: "step", num: 2, title: "5-4-3-2-1 Grounding", text: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This yanks your brain out of anxiety and into the present." },
      { type: "step", num: 3, title: "One Minute of Breath", text: "Close your eyes. Breathe in for 4 counts, out for 6 counts. The longer exhale activates your parasympathetic nervous system — your body's built-in calm button." },
      { type: "step", num: 4, title: "Set a Micro-Intention", text: "Before opening your eyes, choose one word for the next hour: calm, focus, patience, kindness. Let it guide you." },
      { type: "tip", text: "Set a daily phone alarm labeled 'breathe' — your future self will thank you." }
    ]
  },
  {
    id: "gratitude-practice", title: "Building a Gratitude Habit", icon: "🙏", category: "gratitude", time: "4 min",
    preview: "Why gratitude rewires your brain and how to make it stick.",
    content: [
      { type: "intro", text: "Gratitude isn't about toxic positivity or ignoring problems. It's about training your brain to notice what's already good alongside what's hard." },
      { type: "step", num: 1, title: "Start Stupid Small", text: "Don't aim for profound. 'I'm grateful for hot coffee' counts. 'I'm grateful my bed is comfortable' counts. Lower the bar so you actually do it." },
      { type: "step", num: 2, title: "Get Specific", text: "Instead of 'I'm grateful for my friend,' try 'I'm grateful Sam texted me that dumb meme today because it made me laugh when I needed it.' Specificity deepens the feeling." },
      { type: "step", num: 3, title: "Anchor It", text: "Attach gratitude to something you already do: while brushing teeth, waiting for coffee, or right before sleep. Habits stick when piggybacked onto existing routines." },
      { type: "step", num: 4, title: "Write It Down", text: "Thinking grateful thoughts is good. Writing them is 10x better. The physical act of writing engages different brain pathways and makes the memory stickier." },
      { type: "tip", text: "Research shows it takes about 21 days of consistent gratitude practice to notice a shift in your default mood." }
    ]
  },
  {
    id: "confidence-boost", title: "The Confidence Playbook", icon: "💪", category: "confidence", time: "6 min",
    preview: "Confidence isn't a personality trait — it's a skill you can build.",
    content: [
      { type: "intro", text: "Confidence isn't about never feeling scared. It's about doing the thing anyway. Here's how to build that muscle." },
      { type: "step", num: 1, title: "Keep a Win Log", text: "Every night, write down 1-3 things you did well. They can be small: 'I spoke up in a meeting,' 'I cooked a real meal,' 'I went to the gym even though I didn't want to.' Over time, this becomes undeniable evidence that you're capable." },
      { type: "step", num: 2, title: "Act Before You Feel Ready", text: "Confidence doesn't come before action — it comes after. You won't feel confident before the hard conversation. You'll feel confident after having it. Action first, feelings follow." },
      { type: "step", num: 3, title: "Power Posing Works", text: "Stand tall for 2 minutes before a stressful situation. Hands on hips, shoulders back, chin up. It sounds ridiculous but studies show it measurably reduces cortisol." },
      { type: "step", num: 4, title: "Borrow Confidence", text: "Think of someone you admire. Ask: 'What would they do here?' Sometimes stepping into someone else's shoes gives you permission to be bolder than you'd normally allow." },
      { type: "tip", text: "Comparison is confidence poison. The only person you need to be better than is who you were yesterday." }
    ]
  },
  {
    id: "better-sleep", title: "Wind Down for Better Sleep", icon: "😴", category: "sleep", time: "5 min",
    preview: "Simple changes that dramatically improve your sleep quality.",
    content: [
      { type: "intro", text: "Good sleep isn't just about quantity — it's about what you do in the hour before bed. Small tweaks make a massive difference." },
      { type: "step", num: 1, title: "The 60-Minute Wind Down", text: "Set an alarm 60 minutes before bed. This is your signal: dim the lights, put your phone across the room, and switch to calm activities." },
      { type: "step", num: 2, title: "Brain Dump", text: "Spend 5 minutes writing everything that's on your mind — tasks, worries, random thoughts. Getting it on paper tells your brain it's safe to stop holding onto it." },
      { type: "step", num: 3, title: "Temperature Drop", text: "Your body needs to cool down to sleep. Take a warm shower (counterintuitive but it causes a rebound cooling effect), keep your room around 65-68°F, and consider losing the heavy blanket." },
      { type: "step", num: 4, title: "The 4-7-8 Method", text: "In bed: breathe in for 4 counts, hold for 7, exhale for 8. This activates your vagus nerve and signals your body to power down. Most people fall asleep within 3 cycles." },
      { type: "tip", text: "If you can't sleep after 20 minutes, get up and do something boring in dim light until you feel drowsy. Lying in bed frustrated teaches your brain that bed = stress." }
    ]
  },
  {
    id: "healthy-boundaries", title: "Setting Boundaries Without Guilt", icon: "🛡️", category: "relationships", time: "5 min",
    preview: "How to protect your energy while maintaining your relationships.",
    content: [
      { type: "intro", text: "Boundaries aren't walls. They're bridges with gates — you get to choose who crosses and when. Here's how to build them." },
      { type: "step", num: 1, title: "Know Your Limits", text: "Pay attention to resentment — it's your body's boundary alarm. If you feel drained, annoyed, or taken advantage of after interactions, a boundary is needed." },
      { type: "step", num: 2, title: "Use 'I' Statements", text: "'I need some time to recharge after work before socializing' lands better than 'You always drain me.' Boundaries are about YOUR needs, not the other person's flaws." },
      { type: "step", num: 3, title: "Start with Low-Stakes Situations", text: "Practice saying no to small things first: the extra project, the social event you don't want to attend, the phone call when you're tired. Build the muscle before the big stuff." },
      { type: "step", num: 4, title: "Sit with the Discomfort", text: "Guilt after setting a boundary is normal — it doesn't mean you did something wrong. It means you're learning a new skill. The discomfort shrinks with practice." },
      { type: "tip", text: "A boundary without a consequence is just a suggestion. Decide in advance what you'll do if your boundary isn't respected." }
    ]
  },
  {
    id: "overcome-anxiety", title: "Taming Everyday Anxiety", icon: "🌊", category: "calm", time: "6 min",
    preview: "Practical tools for when your mind won't stop racing.",
    content: [
      { type: "intro", text: "Anxiety isn't a character flaw — it's your nervous system trying to protect you. The goal isn't to eliminate it, but to turn down its sensitivity." },
      { type: "step", num: 1, title: "Name What You Feel", text: "Saying 'I notice I'm feeling anxious' activates your prefrontal cortex and dampens the amygdala's alarm response. Naming emotions literally calms your brain." },
      { type: "step", num: 2, title: "Challenge the Story", text: "Anxiety loves 'what if' stories. Ask: 'Is this thought a fact or a prediction?' Most anxious thoughts are predictions disguised as facts. You're not a fortune teller." },
      { type: "step", num: 3, title: "Move Your Body", text: "Anxiety is energy with nowhere to go. Even a 5-minute walk, some jumping jacks, or shaking your hands vigorously can discharge the physical tension your body is holding." },
      { type: "step", num: 4, title: "The Worry Window", text: "Schedule 15 minutes per day as your 'worry time.' When anxious thoughts appear outside that window, write them down and say 'I'll deal with you at 4pm.' This trains your brain that worries have a place — just not right now." },
      { type: "tip", text: "Anxiety often spikes when we're dehydrated, under-slept, or haven't eaten. Before assuming the worst, check the basics." }
    ]
  },
  {
    id: "self-compassion-101", title: "Self-Compassion 101", icon: "💛", category: "self-love", time: "5 min",
    preview: "Stop beating yourself up and start treating yourself like someone you love.",
    content: [
      { type: "intro", text: "Self-compassion isn't self-pity or letting yourself off the hook. It's acknowledging that being human is hard, and you deserve kindness — especially from yourself." },
      { type: "step", num: 1, title: "Notice Self-Criticism", text: "For one day, pay attention to every harsh thing you say to yourself. Most people are shocked by the volume and cruelty. Would you talk to a child this way? Then don't talk to yourself this way." },
      { type: "step", num: 2, title: "Common Humanity", text: "When you mess up, remind yourself: 'Other people feel this too.' You're not uniquely broken. Failure, embarrassment, and struggle are universal human experiences." },
      { type: "step", num: 3, title: "The Self-Compassion Break", text: "When suffering: (1) 'This is hard right now' (mindfulness), (2) 'Struggle is part of being human' (common humanity), (3) Place your hand on your heart and offer yourself kindness." },
      { type: "step", num: 4, title: "Write Yourself a Letter", text: "Think of something you're struggling with. Write a letter to yourself from the perspective of an unconditionally loving friend. Read it when you need it most." },
      { type: "tip", text: "Self-compassion actually increases motivation. When you stop punishing yourself for failures, you become less afraid to try." }
    ]
  }
];

const GUIDE_CATEGORIES = [
  { id: "all", label: "All", icon: "✦" },
  { id: "mindset", label: "Mindset", icon: "🧠" },
  { id: "calm", label: "Calm", icon: "🧘" },
  { id: "gratitude", label: "Gratitude", icon: "🙏" },
  { id: "confidence", label: "Confidence", icon: "💪" },
  { id: "sleep", label: "Sleep", icon: "😴" },
  { id: "relationships", label: "Relationships", icon: "🛡️" },
  { id: "self-love", label: "Self-Love", icon: "💛" },
];

const GARDEN_STAGES = [
  { name: "Bare Soil", minSeeds: 0, emoji: "🟤", desc: "Every garden starts here" },
  { name: "Seedling", minSeeds: 3, emoji: "🌱", desc: "Something's growing!" },
  { name: "Sprout", minSeeds: 8, emoji: "🌿", desc: "You're putting down roots" },
  { name: "Budding", minSeeds: 15, emoji: "🌷", desc: "Beauty is forming" },
  { name: "Blooming", minSeeds: 25, emoji: "🌸", desc: "Your effort is blossoming" },
  { name: "Flourishing", minSeeds: 40, emoji: "🌺", desc: "A vibrant garden" },
  { name: "Lush Garden", minSeeds: 60, emoji: "🌻", desc: "Absolutely radiant" },
  { name: "Paradise", minSeeds: 100, emoji: "🏡", desc: "You built something beautiful" },
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function seededIndex(seed, arrayLength) {
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % arrayLength;
}

export default function DailyShine({ user }) {
  const { signOut } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [gratitudeText, setGratitudeText] = useState("");
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [journalEntries, setJournalEntries] = useState({});
  const [activeTab, setActiveTab] = useState("home");
  const [animateIn, setAnimateIn] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [winsText, setWinsText] = useState(["", "", ""]);
  const [winsSaved, setWinsSaved] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("idle");
  const [breathCount, setBreathCount] = useState(0);
  const [eveningReflection, setEveningReflection] = useState("");
  const [eveningReflectionSaved, setEveningReflectionSaved] = useState(false);
  const [eveningRating, setEveningRating] = useState(null);
  const [eveningSaved, setEveningSaved] = useState(false);
  const [tomorrowIntention, setTomorrowIntention] = useState("");
  const [letGoText, setLetGoText] = useState("");
  const [journalViewExpanded, setJournalViewExpanded] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [moodViewRange, setMoodViewRange] = useState(7);
  const [learnCategory, setLearnCategory] = useState("all");
  const [expandedGuide, setExpandedGuide] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsesToday, setAiUsesToday] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);

  const FREE_AI_LIMIT = 3; // Free users get 3 AI uses per day
  const aiUsesLeft = isPremium ? Infinity : Math.max(0, FREE_AI_LIMIT - aiUsesToday);
  const canUseAI = isPremium || aiUsesToday < FREE_AI_LIMIT;

  const dayOfYear = getDayOfYear();
  const dateKey = getDateKey();
  const todayAffirmation = AFFIRMATIONS[seededIndex(dateKey + "aff", AFFIRMATIONS.length)];
  const todayChallenge = CHALLENGES[seededIndex(dateKey + "ch", CHALLENGES.length)];
  const todayGratitude = GRATITUDE_PROMPTS[seededIndex(dateKey + "gr", GRATITUDE_PROMPTS.length)];
  const todayQuote = QUOTES[seededIndex(dateKey + "qt", QUOTES.length)];

  const greetingName = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Load data from storage (and sync with cloud if logged in)
  useEffect(() => {
    const load = async () => {
      // If logged in, sync cloud data first
      if (user?.id) {
        storage.setUserId(user.id);
        try {
          const cloudData = await loadUserData(user.id);
          if (cloudData) {
            // Cloud data exists — write it to localStorage
            writeToLocal(cloudData);
          } else {
            // No cloud data — migrate localStorage to cloud (first login)
            const localData = getLocalData();
            if (localData) {
              await saveUserData(user.id, localData);
            }
          }
        } catch {}
      }

      // Now load from localStorage (which has cloud data if synced)
      try {
        const moodRes = await storage.get("shine-moods");
        if (moodRes) setMoodHistory(JSON.parse(moodRes.value));
      } catch {}
      try {
        const streakRes = await storage.get("shine-streak");
        if (streakRes) setStreak(JSON.parse(streakRes.value));
      } catch {}
      try {
        const chalRes = await storage.get("shine-challenge-" + dateKey);
        if (chalRes) setChallengeCompleted(JSON.parse(chalRes.value));
      } catch {}
      try {
        const gratRes = await storage.get("shine-gratitude-" + dateKey);
        if (gratRes) {
          setGratitudeText(JSON.parse(gratRes.value));
          setGratitudeSaved(true);
        }
      } catch {}
      try {
        const journalRes = await storage.get("shine-journal");
        if (journalRes) setJournalEntries(JSON.parse(journalRes.value));
      } catch {}
      try {
        const winsRes = await storage.get("shine-wins-" + dateKey);
        if (winsRes) {
          setWinsText(JSON.parse(winsRes.value));
          setWinsSaved(true);
        }
      } catch {}
      try {
        const moodTodayRes = await storage.get("shine-mood-today-" + dateKey);
        if (moodTodayRes) setCurrentMood(JSON.parse(moodTodayRes.value));
      } catch {}
      try {
        const eveRes = await storage.get("shine-evening-" + dateKey);
        if (eveRes) {
          const eveData = JSON.parse(eveRes.value);
          setEveningReflection(eveData.reflection || "");
          setEveningRating(eveData.rating || null);
          setTomorrowIntention(eveData.intention || "");
          setLetGoText(eveData.letGo || "");
          setEveningSaved(true);
          setEveningReflectionSaved(true);
        }
      } catch {}
      try {
        const insightRes = await storage.get("shine-insight-" + dateKey);
        if (insightRes) setWeeklyInsight(JSON.parse(insightRes.value));
      } catch {}
      try {
        const premRes = await storage.get("shine-premium");
        if (premRes) setIsPremium(JSON.parse(premRes.value));
      } catch {}
      try {
        const stripeRes = await storage.get("shine-stripe-customer");
        if (stripeRes) setStripeCustomerId(JSON.parse(stripeRes.value));
      } catch {}
      try {
        const usageRes = await storage.get("shine-ai-usage-" + dateKey);
        if (usageRes) setAiUsesToday(JSON.parse(usageRes.value));
      } catch {}
      setLoaded(true);
      setTimeout(() => setAnimateIn(true), 100);
      
      // Show welcome guide for first-time users (use direct localStorage, not synced storage)
      try {
        const hasSeenWelcome = localStorage.getItem("shine-welcome-seen-local");
        if (!hasSeenWelcome) {
          setTimeout(() => setShowWelcome(true), 800);
        }
      } catch {}
    };
    load();
  }, []);

  const saveMood = async (mood) => {
    setCurrentMood(mood);
    const newHistory = { ...moodHistory, [dateKey]: mood };
    setMoodHistory(newHistory);
    
    // Calculate streak
    let s = 1;
    let d = new Date();
    d.setDate(d.getDate() - 1);
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (newHistory[key] !== undefined) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    setStreak(s);

    try {
      await storage.set("shine-moods", JSON.stringify(newHistory));
      await storage.set("shine-streak", JSON.stringify(s));
      await storage.set("shine-mood-today-" + dateKey, JSON.stringify(mood));
    } catch {}
  };

  const toggleChallenge = async () => {
    const newVal = !challengeCompleted;
    setChallengeCompleted(newVal);
    try {
      await storage.set("shine-challenge-" + dateKey, JSON.stringify(newVal));
    } catch {}
  };

  const saveGratitude = async () => {
    if (!gratitudeText.trim()) return;
    setGratitudeSaved(true);
    const entries = { ...journalEntries, [dateKey]: { gratitude: gratitudeText.trim(), wins: winsText } };
    setJournalEntries(entries);
    try {
      await storage.set("shine-gratitude-" + dateKey, JSON.stringify(gratitudeText.trim()));
      await storage.set("shine-journal", JSON.stringify(entries));
    } catch {}
  };

  const saveWins = async () => {
    if (winsText.every(w => !w.trim())) return;
    setWinsSaved(true);
    try {
      await storage.set("shine-wins-" + dateKey, JSON.stringify(winsText));
    } catch {}
  };

  // Breathing exercise
  useEffect(() => {
    if (!breathingActive) return;
    const phases = [
      { name: "Breathe in", duration: 4000 },
      { name: "Hold", duration: 4000 },
      { name: "Breathe out", duration: 4000 },
      { name: "Hold", duration: 4000 },
    ];
    let phaseIdx = 0;
    let count = 0;
    setBreathPhase(phases[0].name);
    setBreathCount(0);

    const advance = () => {
      phaseIdx = (phaseIdx + 1) % 4;
      if (phaseIdx === 0) {
        count++;
        setBreathCount(count);
        if (count >= 4) {
          setBreathingActive(false);
          setBreathPhase("Done! Great job.");
          setTimeout(() => setBreathPhase("idle"), 3000);
          return;
        }
      }
      setBreathPhase(phases[phaseIdx].name);
      timer = setTimeout(advance, phases[phaseIdx].duration);
    };

    let timer = setTimeout(advance, phases[0].duration);
    return () => clearTimeout(timer);
  }, [breathingActive]);

  // Get mood history for N days
  const getMoodDays = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      days.push({
        label: i === 0 ? "Today" : n <= 7 ? dayNames[d.getDay()] : `${monthNames[d.getMonth()]} ${d.getDate()}`,
        mood: moodHistory[key] || null,
        key,
        date: d
      });
    }
    return days;
  };

  const getLast7Days = () => getMoodDays(7);

  const getAverageMood = (n) => {
    const days = getMoodDays(n);
    const moods = days.filter(d => d.mood !== null).map(d => d.mood);
    if (moods.length === 0) return null;
    return (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1);
  };

  const getJournalDays = () => {
    return Object.keys(journalEntries)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map(key => ({
        key,
        date: new Date(key + "T12:00:00"),
        ...journalEntries[key]
      }));
  };

  const saveEvening = async () => {
    const eveData = {
      reflection: eveningReflection.trim(),
      rating: eveningRating,
      intention: tomorrowIntention.trim(),
      letGo: letGoText.trim()
    };
    setEveningSaved(true);
    setEveningReflectionSaved(true);
    
    // Also save to journal
    const entries = { 
      ...journalEntries, 
      [dateKey]: { 
        ...(journalEntries[dateKey] || {}),
        gratitude: gratitudeText.trim(),
        wins: winsText,
        evening: eveData
      } 
    };
    setJournalEntries(entries);
    
    try {
      await storage.set("shine-evening-" + dateKey, JSON.stringify(eveData));
      await storage.set("shine-journal", JSON.stringify(entries));
    } catch {}
  };

  const trackAIUse = async () => {
    const newCount = aiUsesToday + 1;
    setAiUsesToday(newCount);
    try { await storage.set("shine-ai-usage-" + dateKey, JSON.stringify(newCount)); } catch {}
  };

  const togglePremium = async () => {
    const newVal = !isPremium;
    setIsPremium(newVal);
    try { await storage.set("shine-premium", JSON.stringify(newVal)); } catch {}
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgradeLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        setUpgradeLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) return;
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  // Check for ?upgraded=true from Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgraded') === 'true') {
        setIsPremium(true);
        storage.set("shine-premium", JSON.stringify(true));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const generateInsight = async () => {
    setInsightLoading(true);
    const recentDays = getMoodDays(7);
    const moodSummary = recentDays
      .filter(d => d.mood)
      .map(d => `${d.label}: ${MOODS[d.mood - 1].label} (${d.mood}/5)`)
      .join(", ");
    
    const recentEntries = Object.keys(journalEntries)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5)
      .map(k => {
        const e = journalEntries[k];
        return `${k}: gratitude="${e.gratitude || 'none'}", wins=${JSON.stringify(e.wins || [])}, evening="${e.evening?.reflection || 'none'}"`;
      })
      .join("; ");

    // Local fallback insight based on actual data
    const getLocalInsight = () => {
      const moodDays = recentDays.filter(d => d.mood);
      const avg = moodDays.length > 0 ? moodDays.reduce((a, d) => a + d.mood, 0) / moodDays.length : 0;
      const entryCount = Object.keys(journalEntries).length;
      
      if (moodDays.length === 0) return {
        emoji: "🌱", headline: "Your journey is just beginning",
        insight: "You haven't logged many moods yet, and that's totally okay — every garden starts with bare soil. The fact that you're here and exploring says something good about where you're headed.",
        suggestion: "Try logging your mood once a day this week — even just tapping an emoji counts."
      };
      if (avg >= 4) return {
        emoji: "☀️", headline: "You're riding a great wave",
        insight: `You've logged ${moodDays.length} moods this week with an average around ${avg.toFixed(1)}/5. That's a strong week! ${entryCount > 3 ? "Your journaling consistency is paying off — writing things down keeps good energy flowing." : "Consider journaling more to capture what's making this stretch so good."}`,
        suggestion: "Share your energy — do something kind for someone else this week."
      };
      if (avg >= 3) return {
        emoji: "🌿", headline: "Steady and grounded",
        insight: `Your mood has been hovering around ${avg.toFixed(1)}/5 this week — not every week has to be a highlight reel. ${streak > 3 ? `Your ${streak}-day streak shows real commitment.` : "Building consistency is the real win here."} Steady days build the foundation for great ones.`,
        suggestion: "Pick one thing that usually lifts your mood and schedule it this week."
      };
      return {
        emoji: "💜", headline: "Tough week, but you showed up",
        insight: `This week was harder — your average mood was around ${avg.toFixed(1)}/5. But here's what matters: you're still here, still checking in, still trying. ${moodDays.length >= 5 ? "Logging your mood even on rough days takes real honesty." : "Every check-in is a small act of self-care."}`,
        suggestion: "Be extra gentle with yourself. Lower the bar and celebrate small wins."
      };
    };

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: `You're a warm wellbeing coach analyzing a user's mood and journal data from their positivity app. Give them a personalized weekly insight.

Respond with ONLY a JSON object (no markdown, no backticks):
- "headline": A short, encouraging headline about their week (max 10 words)
- "insight": 2-3 sentences of personalized observation about patterns, wins, or areas of growth you notice. Be specific to their data. Warm but honest.
- "suggestion": One specific, actionable suggestion for next week based on their patterns (max 25 words)
- "emoji": A single emoji that captures their week's vibe`,
          messages: [
            { role: "user", content: `My mood this week: ${moodSummary || "No moods logged yet"}. Journal entries: ${recentEntries || "None yet"}. Streak: ${streak} days.` }
          ]
        })
      });
      const data = await response.json();
      
      if (data.fallback) {
        const local = getLocalInsight();
        setWeeklyInsight(local);
        try { await storage.set("shine-insight-" + dateKey, JSON.stringify(local)); } catch {}
        setInsightLoading(false);
        return;
      }

      const text = data.content.map(i => i.text || "").join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setWeeklyInsight(parsed);
      try { await storage.set("shine-insight-" + dateKey, JSON.stringify(parsed)); } catch {}
    } catch {
      const local = getLocalInsight();
      setWeeklyInsight(local);
      try { await storage.set("shine-insight-" + dateKey, JSON.stringify(local)); } catch {}
    }
    setInsightLoading(false);
  };

  const completionCount = [currentMood !== null, challengeCompleted, gratitudeSaved].filter(Boolean).length;
  const isEvening = new Date().getHours() >= 17;

  // Garden: count total "seeds" (completed activities across all days)
  const totalSeeds = (() => {
    let seeds = 0;
    seeds += Object.keys(moodHistory).length; // each mood logged = 1 seed
    seeds += Object.keys(journalEntries).length * 2; // each journal day = 2 seeds
    seeds += streak; // streak bonus
    if (challengeCompleted) seeds += 1;
    if (gratitudeSaved) seeds += 1;
    if (eveningSaved) seeds += 2;
    if (winsSaved) seeds += 1;
    return seeds;
  })();

  const gardenStage = [...GARDEN_STAGES].reverse().find(s => totalSeeds >= s.minSeeds) || GARDEN_STAGES[0];
  const nextStage = GARDEN_STAGES[GARDEN_STAGES.indexOf(gardenStage) + 1];
  const gardenProgress = nextStage 
    ? (totalSeeds - gardenStage.minSeeds) / (nextStage.minSeeds - gardenStage.minSeeds)
    : 1;

  if (!loaded) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 30%, #F5EBE0 60%, #EDE4DA 100%)",
      fontFamily: "'Instrument Serif', 'Georgia', serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 20% 50%, #D4A574 1px, transparent 1px),
                          radial-gradient(circle at 80% 20%, #C4956A 1px, transparent 1px),
                          radial-gradient(circle at 60% 80%, #B8886A 1px, transparent 1px)`,
        backgroundSize: "60px 60px, 80px 80px, 100px 100px"
      }} />

      {/* Floating orbs */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,151,107,0.12) 0%, transparent 70%)",
        pointerEvents: "none", animation: "float 20s ease-in-out infinite"
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-10%", width: 500, height: 500,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(196,168,130,0.1) 0%, transparent 70%)",
        pointerEvents: "none", animation: "float 25s ease-in-out infinite reverse"
      }} />

      <style>{`
        
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(232,151,107,0.15); }
          50% { box-shadow: 0 0 40px rgba(232,151,107,0.3); }
        }

        @keyframes breathe {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1); }
        }

        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes checkPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212,165,116,0.15);
          border-radius: 24px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(180,140,100,0.1);
        }
        
        .tab-btn {
          background: none;
          border: none;
          padding: 10px 12px;
          border-radius: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #8B7355;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        
        .tab-btn.active {
          background: rgba(232,151,107,0.15);
          color: #C4764A;
          font-weight: 600;
        }
        
        .mood-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(212,165,116,0.2);
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .mood-btn:hover {
          transform: scale(1.15);
          border-color: rgba(232,151,107,0.5);
          background: rgba(255,255,255,0.8);
        }
        
        .mood-btn.selected {
          border-color: #E8976B;
          background: rgba(232,151,107,0.15);
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(232,151,107,0.25);
        }
      `}</style>

      {/* Main Container */}
      <div style={{
        maxWidth: 520, margin: "0 auto", padding: "20px 20px 100px",
        position: "relative", zIndex: 1,
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "30px 0 20px", position: "relative" }}>
          {/* Help button */}
          <button onClick={() => { setShowWelcome(true); setWelcomeStep(0); }} style={{
            position: "absolute", top: 30, right: 44,
            width: 32, height: 32, borderRadius: "50%",
            border: "1px solid rgba(212,165,116,0.25)",
            background: "rgba(255,255,255,0.5)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: "#A8957F", fontWeight: 600,
            transition: "all 0.3s"
          }}>
            ?
          </button>

          {/* Account button */}
          <button onClick={() => setActiveTab("account")} style={{
            position: "absolute", top: 30, right: 0,
            width: 36, height: 36, borderRadius: "50%",
            border: user ? "2px solid #E8976B" : "1px solid rgba(212,165,116,0.3)",
            background: user ? "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))" : "rgba(255,255,255,0.5)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: user ? 14 : 16,
            color: user ? "#C4764A" : "#A8957F", fontWeight: 600,
            transition: "all 0.3s"
          }}>
            {user ? (user.email?.[0]?.toUpperCase() || "U") : "👤"}
          </button>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(232,151,107,0.1)", padding: "8px 20px",
            borderRadius: 100, marginBottom: 16,
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            color: "#C4764A", fontWeight: 500, letterSpacing: "0.5px"
          }}>
            ☀️ Daily Shine
            {streak > 0 && (
              <span style={{
                background: "linear-gradient(135deg, #E8976B, #D4764A)",
                color: "white", padding: "3px 10px", borderRadius: 100,
                fontSize: 12, fontWeight: 600,
                animation: streak >= 3 ? "streakPulse 2s ease-in-out infinite" : "none"
              }}>
                🔥 {streak} day{streak !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 400, color: "#3D3028",
            lineHeight: 1.2, marginBottom: 6
          }}>
            {greetingName()} ✨
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: "#8B7355", fontWeight: 300
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Progress Dots */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 8, marginBottom: 28
        }}>
          {[currentMood !== null, challengeCompleted, gratitudeSaved].map((done, i) => (
            <div key={i} style={{
              width: done ? 28 : 8, height: 8, borderRadius: 100,
              background: done ? "linear-gradient(90deg, #E8976B, #D4A574)" : "rgba(212,165,116,0.2)",
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            }} />
          ))}
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            color: "#A8957F", marginLeft: 8
          }}>
            {completionCount}/3 today
          </span>
        </div>

        {/* ===== HOME TAB ===== */}
        {activeTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Affirmation Card */}
            <div className="card" style={{
              background: "linear-gradient(135deg, rgba(232,151,107,0.12) 0%, rgba(255,255,255,0.7) 100%)",
              textAlign: "center", padding: "36px 32px",
              animation: "fadeUp 0.6s ease-out"
            }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#C4764A", marginBottom: 16, fontWeight: 600
              }}>
                Today's Affirmation
              </div>
              <p style={{
                fontSize: 22, lineHeight: 1.5, color: "#3D3028",
                fontStyle: "italic", fontWeight: 400
              }}>
                "{todayAffirmation}"
              </p>
            </div>

            {/* Mood Check-in */}
            <div className="card" style={{ animation: "fadeUp 0.7s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 20, fontWeight: 600
              }}>
                How are you feeling?
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                {MOODS.map(mood => (
                  <div key={mood.value} style={{ textAlign: "center" }}>
                    <button
                      className={`mood-btn ${currentMood === mood.value ? 'selected' : ''}`}
                      onClick={() => saveMood(mood.value)}
                    >
                      {mood.emoji}
                    </button>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                      color: currentMood === mood.value ? "#C4764A" : "#A8957F",
                      marginTop: 8, fontWeight: currentMood === mood.value ? 600 : 400,
                      transition: "all 0.3s"
                    }}>
                      {mood.label}
                    </div>
                  </div>
                ))}
              </div>
              {currentMood !== null && (
                <div style={{
                  marginTop: 16, padding: "12px 16px",
                  background: "rgba(232,151,107,0.08)", borderRadius: 16,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: "#8B7355", textAlign: "center",
                  animation: "fadeUp 0.4s ease-out"
                }}>
                  {currentMood <= 2 
                    ? "It's okay to have tough days. Be extra gentle with yourself today. 💛"
                    : currentMood === 3 
                    ? "Steady days matter too. You're doing just fine. 🌿"
                    : "Love to see it! Let that good energy flow. ☀️"
                  }
                </div>
              )}
            </div>

            {/* Daily Challenge */}
            <div className="card" style={{
              animation: "fadeUp 0.8s ease-out",
              border: challengeCompleted ? "1px solid rgba(130,180,130,0.3)" : undefined,
              background: challengeCompleted ? "rgba(130,180,130,0.06)" : undefined
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 16
              }}>
                <div style={{
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase", letterSpacing: 2,
                  color: "#8B7355", fontWeight: 600
                }}>
                  Today's Challenge
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  background: "rgba(212,165,116,0.15)", padding: "4px 12px",
                  borderRadius: 100, color: "#A8886A", fontWeight: 500
                }}>
                  {todayChallenge.category}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={toggleChallenge} style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  border: challengeCompleted ? "none" : "2px solid rgba(212,165,116,0.3)",
                  background: challengeCompleted ? "linear-gradient(135deg, #82B482, #6BA26B)" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s", color: "white", fontSize: 18
                }}>
                  {challengeCompleted && <span style={{ animation: "checkPop 0.3s ease-out" }}>✓</span>}
                </button>
                <div>
                  <span style={{ fontSize: 22, marginRight: 10 }}>{todayChallenge.icon}</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                    color: challengeCompleted ? "#6BA26B" : "#4A3F35",
                    textDecoration: challengeCompleted ? "line-through" : "none",
                    opacity: challengeCompleted ? 0.7 : 1,
                    transition: "all 0.3s"
                  }}>
                    {todayChallenge.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Gratitude Prompt */}
            <div className="card" style={{ animation: "fadeUp 0.9s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 16, fontWeight: 600
              }}>
                Gratitude Moment
              </div>
              <p style={{
                fontSize: 17, color: "#3D3028", marginBottom: 16, lineHeight: 1.4,
                fontStyle: "italic"
              }}>
                {todayGratitude}
              </p>
              {!gratitudeSaved ? (
                <div>
                  <textarea
                    value={gratitudeText}
                    onChange={e => setGratitudeText(e.target.value)}
                    placeholder="Write your answer here..."
                    style={{
                      width: "100%", minHeight: 80, padding: 16,
                      background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
                      borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, color: "#4A3F35", resize: "vertical",
                      outline: "none", transition: "border-color 0.3s"
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(232,151,107,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(212,165,116,0.2)"}
                  />
                  <button onClick={saveGratitude} style={{
                    marginTop: 12, padding: "10px 24px", borderRadius: 100,
                    border: "none", background: gratitudeText.trim() ? "linear-gradient(135deg, #E8976B, #D4764A)" : "rgba(212,165,116,0.2)",
                    color: gratitudeText.trim() ? "white" : "#A8957F",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                    cursor: gratitudeText.trim() ? "pointer" : "default",
                    transition: "all 0.3s"
                  }}>
                    Save ✨
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: 16, background: "rgba(130,180,130,0.08)",
                  borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: "#6BA26B"
                }}>
                  ✓ Saved — "{gratitudeText}"
                </div>
              )}
            </div>

            {/* Quote */}
            <div className="card" onClick={() => setShowQuote(!showQuote)} style={{
              cursor: "pointer", textAlign: "center",
              animation: "fadeUp 1s ease-out",
              background: showQuote ? "linear-gradient(135deg, rgba(196,168,130,0.1) 0%, rgba(255,255,255,0.7) 100%)" : undefined
            }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: showQuote ? 16 : 0, fontWeight: 600,
                transition: "margin 0.3s"
              }}>
                {showQuote ? "Quote of the Day" : "Tap for today's quote ✦"}
              </div>
              {showQuote && (
                <div style={{ animation: "fadeUp 0.4s ease-out" }}>
                  <p style={{ fontSize: 18, color: "#3D3028", fontStyle: "italic", lineHeight: 1.5, marginBottom: 12 }}>
                    "{todayQuote.text}"
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#A8957F" }}>
                    — {todayQuote.author}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TOOLS TAB ===== */}
        {activeTab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Breathing Exercise */}
            <div className="card" style={{
              textAlign: "center", animation: "fadeUp 0.6s ease-out"
            }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 24, fontWeight: 600
              }}>
                Box Breathing
              </div>
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                margin: "0 auto 24px",
                background: breathingActive
                  ? "radial-gradient(circle, rgba(232,151,107,0.3) 0%, rgba(232,151,107,0.05) 70%)"
                  : "radial-gradient(circle, rgba(212,165,116,0.15) 0%, rgba(212,165,116,0.03) 70%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.5s",
                animation: breathingActive ? "breathe 4s ease-in-out infinite" : "none"
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: breathingActive
                    ? "linear-gradient(135deg, #E8976B, #D4A574)"
                    : "rgba(212,165,116,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.5s"
                }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: breathingActive ? "white" : "#8B7355", fontWeight: 500
                  }}>
                    {breathingActive ? breathCount + "/4" : "🌬️"}
                  </span>
                </div>
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 18,
                color: "#3D3028", marginBottom: 20, minHeight: 28, fontWeight: 300
              }}>
                {breathPhase === "idle" ? "4 seconds in, 4 hold, 4 out, 4 hold" : breathPhase}
              </p>
              <button onClick={() => {
                if (!breathingActive) {
                  setBreathingActive(true);
                  setBreathPhase("Breathe in");
                  setBreathCount(0);
                } else {
                  setBreathingActive(false);
                  setBreathPhase("idle");
                }
              }} style={{
                padding: "12px 32px", borderRadius: 100, border: "none",
                background: breathingActive
                  ? "rgba(139,115,85,0.15)"
                  : "linear-gradient(135deg, #E8976B, #D4764A)",
                color: breathingActive ? "#8B7355" : "white",
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                cursor: "pointer", transition: "all 0.3s"
              }}>
                {breathingActive ? "Stop" : "Start Breathing"}
              </button>
            </div>

            {/* 3 Wins Today */}
            <div className="card" style={{ animation: "fadeUp 0.7s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 20, fontWeight: 600
              }}>
                3 Wins Today
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A8957F", marginBottom: 16
              }}>
                Even small victories count. What went right?
              </p>
              {!winsSaved ? (
                <div>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(232,151,107,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: "#C4764A", fontWeight: 600, flexShrink: 0
                      }}>
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={winsText[i]}
                        onChange={e => {
                          const nw = [...winsText];
                          nw[i] = e.target.value;
                          setWinsText(nw);
                        }}
                        placeholder={["First win...", "Second win...", "Third win..."][i]}
                        style={{
                          flex: 1, padding: "10px 14px",
                          background: "rgba(255,255,255,0.5)",
                          border: "1px solid rgba(212,165,116,0.2)",
                          borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14, color: "#4A3F35", outline: "none"
                        }}
                      />
                    </div>
                  ))}
                  <button onClick={saveWins} style={{
                    marginTop: 8, padding: "10px 24px", borderRadius: 100,
                    border: "none",
                    background: winsText.some(w => w.trim())
                      ? "linear-gradient(135deg, #E8976B, #D4764A)" : "rgba(212,165,116,0.2)",
                    color: winsText.some(w => w.trim()) ? "white" : "#A8957F",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                    cursor: winsText.some(w => w.trim()) ? "pointer" : "default"
                  }}>
                    Save Wins 🏆
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: 16, background: "rgba(130,180,130,0.08)",
                  borderRadius: 16
                }}>
                  {winsText.filter(w => w.trim()).map((w, i) => (
                    <div key={i} style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      color: "#6BA26B", padding: "4px 0"
                    }}>
                      ✓ {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Coach */}
            <AskCoachCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} />

            {/* AI Reframe Tool */}
            <ReframeCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} />

            {/* Self-Compassion Letter */}
            <CompassionCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} />

            {/* Random Act of Kindness */}
            <RandomActCard />
          </div>
        )}

        {/* ===== LEARN TAB ===== */}
        {activeTab === "learn" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center", padding: "10px 0 0", animation: "fadeUp 0.5s ease-out" }}>
              <h2 style={{ fontSize: 26, color: "#3D3028", fontWeight: 400, marginBottom: 6 }}>
                Positivity Library
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#A8957F" }}>
                Short guides to help you grow, one topic at a time.
              </p>
            </div>

            {/* Category Filter */}
            <div style={{
              display: "flex", gap: 6, overflowX: "auto", padding: "4px 0",
              WebkitOverflowScrolling: "touch", animation: "fadeUp 0.6s ease-out"
            }}>
              {GUIDE_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setLearnCategory(cat.id); setExpandedGuide(null); }} style={{
                  padding: "8px 14px", borderRadius: 100, border: "none", whiteSpace: "nowrap",
                  background: learnCategory === cat.id ? "rgba(232,151,107,0.15)" : "rgba(255,255,255,0.5)",
                  color: learnCategory === cat.id ? "#C4764A" : "#8B7355",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: learnCategory === cat.id ? 600 : 400,
                  cursor: "pointer", transition: "all 0.2s", flexShrink: 0
                }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Guide Cards */}
            {GUIDES
              .filter(g => learnCategory === "all" || g.category === learnCategory)
              .map((guide, i) => {
                const isOpen = expandedGuide === guide.id;
                return (
                  <div key={guide.id} className="card" style={{
                    animation: `fadeUp ${0.5 + i * 0.08}s ease-out`,
                    cursor: "pointer", padding: isOpen ? 28 : 22,
                    background: isOpen ? "rgba(255,255,255,0.8)" : undefined
                  }} onClick={() => setExpandedGuide(isOpen ? null : guide.id)}>
                    
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 16,
                        background: "rgba(232,151,107,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0
                      }}>
                        {guide.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontFamily: "'Instrument Serif', Georgia, serif",
                          fontSize: 18, color: "#3D3028", fontWeight: 400, marginBottom: 4
                        }}>
                          {guide.title}
                        </h3>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                            color: "#A8957F"
                          }}>
                            ⏱ {guide.time}
                          </span>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                            background: "rgba(212,165,116,0.12)", padding: "3px 8px",
                            borderRadius: 100, color: "#A8886A", fontWeight: 500
                          }}>
                            {guide.category}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 16, color: "#C0B0A0", transition: "transform 0.3s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                      }}>▾</span>
                    </div>

                    {/* Preview */}
                    {!isOpen && (
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: "#A8957F", marginTop: 10, lineHeight: 1.4
                      }}>
                        {guide.preview}
                      </p>
                    )}

                    {/* Full Content */}
                    {isOpen && (
                      <div style={{
                        marginTop: 20, paddingTop: 20,
                        borderTop: "1px solid rgba(212,165,116,0.1)",
                        animation: "fadeUp 0.4s ease-out"
                      }} onClick={e => e.stopPropagation()}>
                        {guide.content.map((block, j) => {
                          if (block.type === "intro") return (
                            <p key={j} style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                              color: "#4A3F35", lineHeight: 1.7, marginBottom: 20
                            }}>{block.text}</p>
                          );
                          if (block.type === "step") return (
                            <div key={j} style={{
                              display: "flex", gap: 14, marginBottom: 18
                            }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                background: "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                color: "#C4764A", fontWeight: 700
                              }}>
                                {block.num}
                              </div>
                              <div>
                                <h4 style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                                  color: "#3D3028", fontWeight: 600, marginBottom: 4
                                }}>{block.title}</h4>
                                <p style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                  color: "#5A4F45", lineHeight: 1.6
                                }}>{block.text}</p>
                              </div>
                            </div>
                          );
                          if (block.type === "tip") return (
                            <div key={j} style={{
                              padding: "14px 18px", borderRadius: 16,
                              background: "rgba(130,180,130,0.08)",
                              border: "1px solid rgba(130,180,130,0.12)",
                              marginTop: 8
                            }}>
                              <p style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                color: "#5A8A5A", lineHeight: 1.5
                              }}>
                                💡 <strong>Remember:</strong> {block.text}
                              </p>
                            </div>
                          );
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== EVENING TAB ===== */}
        {activeTab === "evening" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Evening Header */}
            <div className="card" style={{
              textAlign: "center", animation: "fadeUp 0.5s ease-out",
              background: "linear-gradient(135deg, rgba(75,65,100,0.08) 0%, rgba(255,255,255,0.6) 100%)"
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌙</div>
              <h2 style={{
                fontSize: 24, color: "#3D3028", fontWeight: 400, marginBottom: 6
              }}>
                Evening Wind-Down
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#A8957F"
              }}>
                Take a few quiet minutes to close out your day.
              </p>
            </div>

            {/* Day Rating */}
            <div className="card" style={{ animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 20, fontWeight: 600
              }}>
                Rate Your Day
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => !eveningSaved && setEveningRating(n)} style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: eveningRating === n ? "2px solid #9B7DC8" : "1px solid rgba(212,165,116,0.2)",
                    background: eveningRating !== null && n <= eveningRating 
                      ? `rgba(155,125,200,${0.1 + (n/10) * 0.3})`
                      : "rgba(255,255,255,0.5)",
                    cursor: eveningSaved ? "default" : "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: eveningRating !== null && n <= eveningRating ? "#6B4A8A" : "#A8957F",
                    fontWeight: eveningRating === n ? 700 : 400,
                    transition: "all 0.2s"
                  }}>
                    {n}
                  </button>
                ))}
              </div>
              {eveningRating && (
                <p style={{
                  textAlign: "center", marginTop: 12,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  color: "#9B7DC8", animation: "fadeUp 0.3s ease-out"
                }}>
                  {eveningRating <= 3 ? "Tough day. Tomorrow is a clean slate. 💜" 
                   : eveningRating <= 6 ? "A solid day. Not every day has to be a 10. 🌿"
                   : eveningRating <= 8 ? "Good day! Hold onto that energy. ✨"
                   : "What a great day! You earned that. 🌟"}
                </p>
              )}
            </div>

            {/* Evening Reflection */}
            <div className="card" style={{ animation: "fadeUp 0.7s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 16, fontWeight: 600
              }}>
                Reflect on Today
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A8957F", marginBottom: 14, fontStyle: "italic"
              }}>
                What's one thing you learned about yourself today?
              </p>
              {!eveningReflectionSaved ? (
                <textarea
                  value={eveningReflection}
                  onChange={e => setEveningReflection(e.target.value)}
                  placeholder="Take a moment to reflect..."
                  style={{
                    width: "100%", minHeight: 80, padding: 16,
                    background: "rgba(255,255,255,0.5)", border: "1px solid rgba(155,125,200,0.2)",
                    borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, color: "#4A3F35", resize: "vertical", outline: "none"
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, background: "rgba(155,125,200,0.06)",
                  borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: "#6B4A8A"
                }}>
                  ✓ {eveningReflection}
                </div>
              )}
            </div>

            {/* Let Go */}
            <div className="card" style={{ animation: "fadeUp 0.8s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 16, fontWeight: 600
              }}>
                🎈 Let It Go
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A8957F", marginBottom: 14
              }}>
                Write something you want to release from today. Let it float away.
              </p>
              {!eveningSaved ? (
                <textarea
                  value={letGoText}
                  onChange={e => setLetGoText(e.target.value)}
                  placeholder="What are you ready to let go of?"
                  style={{
                    width: "100%", minHeight: 60, padding: 16,
                    background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
                    borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, color: "#4A3F35", resize: "vertical", outline: "none"
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, background: "rgba(130,180,130,0.06)",
                  borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: "#7BA87B", fontStyle: "italic", textAlign: "center"
                }}>
                  Released 🎈 — it's no longer yours to carry
                </div>
              )}
            </div>

            {/* Tomorrow's Intention */}
            <div className="card" style={{ animation: "fadeUp 0.9s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 16, fontWeight: 600
              }}>
                Tomorrow's Intention
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A8957F", marginBottom: 14
              }}>
                Set one gentle intention for tomorrow.
              </p>
              {!eveningSaved ? (
                <input
                  type="text"
                  value={tomorrowIntention}
                  onChange={e => setTomorrowIntention(e.target.value)}
                  placeholder="e.g., I will be patient with myself"
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
                    borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, color: "#4A3F35", outline: "none"
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, background: "rgba(232,151,107,0.08)",
                  borderRadius: 16, fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 17, color: "#C4764A", fontStyle: "italic", textAlign: "center"
                }}>
                  ✨ {tomorrowIntention || "Rest well, tomorrow is waiting."}
                </div>
              )}
            </div>

            {/* Save Evening Button */}
            {!eveningSaved && (
              <button onClick={saveEvening} style={{
                padding: "16px 32px", borderRadius: 100, border: "none",
                background: (eveningRating || eveningReflection.trim())
                  ? "linear-gradient(135deg, #9B7DC8, #7B5DA8)"
                  : "rgba(212,165,116,0.2)",
                color: (eveningRating || eveningReflection.trim()) ? "white" : "#A8957F",
                fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500,
                cursor: (eveningRating || eveningReflection.trim()) ? "pointer" : "default",
                transition: "all 0.3s", width: "100%",
                animation: "fadeUp 1s ease-out"
              }}>
                Close Out Today 🌙
              </button>
            )}

            {eveningSaved && (
              <div className="card" style={{
                textAlign: "center", animation: "fadeUp 0.5s ease-out",
                background: "linear-gradient(135deg, rgba(155,125,200,0.08), rgba(255,255,255,0.7))"
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🌟</div>
                <p style={{
                  fontSize: 20, color: "#3D3028", fontStyle: "italic", lineHeight: 1.4
                }}>
                  Your day is complete. Sleep well — you did enough today.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== HISTORY/PROGRESS TAB ===== */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Garden Visualization */}
            <div className="card" style={{
              animation: "fadeUp 0.5s ease-out", textAlign: "center",
              background: "linear-gradient(180deg, rgba(130,200,160,0.08) 0%, rgba(255,255,255,0.6) 100%)",
              overflow: "hidden", position: "relative"
            }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#5A8A5A", marginBottom: 16, fontWeight: 600
              }}>
                🌱 Your Positivity Garden
              </div>

              {/* Garden Scene */}
              <div style={{
                position: "relative", height: 160, marginBottom: 16,
                display: "flex", alignItems: "flex-end", justifyContent: "center"
              }}>
                {/* Ground */}
                <div style={{
                  position: "absolute", bottom: 0, left: -28, right: -28, height: 40,
                  background: "linear-gradient(180deg, #C8B896 0%, #B8A880 100%)",
                  borderRadius: "50% 50% 0 0"
                }} />
                
                {/* Plants based on seeds */}
                <div style={{
                  position: "relative", zIndex: 1, display: "flex",
                  alignItems: "flex-end", justifyContent: "center",
                  gap: 4, paddingBottom: 10, flexWrap: "wrap", maxWidth: 320
                }}>
                  {(() => {
                    const plantEmojis = ["🌱", "🌿", "🍀", "🌷", "🌸", "🌺", "🌻", "🌹", "💐", "🌳"];
                    const count = Math.min(Math.floor(totalSeeds / 3) + 1, 20);
                    const plants = [];
                    for (let i = 0; i < count; i++) {
                      const emojiIdx = Math.min(Math.floor(totalSeeds / 8), plantEmojis.length - 1);
                      const pEmoji = totalSeeds < 3 ? "🌱" : plantEmojis[Math.min(i % (emojiIdx + 1) + Math.floor(i / 3), plantEmojis.length - 1)];
                      const size = 20 + Math.random() * 16;
                      plants.push(
                        <span key={i} style={{
                          fontSize: size, display: "inline-block",
                          animation: `fadeUp ${0.3 + i * 0.1}s ease-out`,
                          transform: `translateY(${-Math.random() * 20}px)`
                        }}>
                          {pEmoji}
                        </span>
                      );
                    }
                    return plants;
                  })()}
                </div>
              </div>

              {/* Stage Info */}
              <div style={{ fontSize: 28, marginBottom: 6 }}>{gardenStage.emoji}</div>
              <h3 style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 22, color: "#3D3028", fontWeight: 400, marginBottom: 4
              }}>
                {gardenStage.name}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: "#7BA87B", marginBottom: 16
              }}>
                {gardenStage.desc}
              </p>

              {/* Progress Bar */}
              {nextStage && (
                <div>
                  <div style={{
                    height: 8, borderRadius: 100,
                    background: "rgba(130,180,130,0.15)",
                    overflow: "hidden", marginBottom: 8
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 100,
                      background: "linear-gradient(90deg, #82B482, #5A9A5A)",
                      width: `${Math.min(gardenProgress * 100, 100)}%`,
                      transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
                    }} />
                  </div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#A8957F"
                  }}>
                    {totalSeeds} seeds planted · {nextStage.minSeeds - totalSeeds} more to reach {nextStage.emoji} {nextStage.name}
                  </p>
                </div>
              )}
              {!nextStage && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  color: "#5A8A5A", fontWeight: 500
                }}>
                  🎉 Maximum bloom! {totalSeeds} seeds planted. You've built a paradise!
                </p>
              )}

              {/* Seed breakdown */}
              <div style={{
                marginTop: 16, padding: "12px 16px",
                background: "rgba(255,255,255,0.5)", borderRadius: 14,
                display: "flex", justifyContent: "space-around",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B7355"
              }}>
                <span>🌤 Moods: {Object.keys(moodHistory).length}</span>
                <span>📝 Journals: {Object.keys(journalEntries).length * 2}</span>
                <span>🔥 Streak: +{streak}</span>
              </div>
            </div>

            {/* Mood Chart with Range Toggle */}
            <div className="card" style={{ animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 20
              }}>
                <div style={{
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase", letterSpacing: 2,
                  color: "#8B7355", fontWeight: 600
                }}>
                  Mood Trend
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[7, 14, 30].map(range => (
                    <button key={range} onClick={() => setMoodViewRange(range)} style={{
                      padding: "4px 12px", borderRadius: 100, border: "none",
                      background: moodViewRange === range ? "rgba(232,151,107,0.15)" : "transparent",
                      color: moodViewRange === range ? "#C4764A" : "#A8957F",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                      fontWeight: moodViewRange === range ? 600 : 400,
                      cursor: "pointer", transition: "all 0.2s"
                    }}>
                      {range}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Line Graph */}
              <div style={{ position: "relative", height: 140, marginBottom: 8 }}>
                {/* Grid lines */}
                {[1,2,3,4,5].map(level => (
                  <div key={level} style={{
                    position: "absolute", left: 0, right: 0,
                    bottom: `${(level - 1) * 25}%`, height: 1,
                    background: "rgba(212,165,116,0.1)"
                  }} />
                ))}
                
                {/* SVG Line */}
                <svg width="100%" height="100%" viewBox={`0 0 ${moodViewRange * 20} 140`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  {(() => {
                    const days = getMoodDays(moodViewRange);
                    const points = days
                      .map((d, i) => d.mood ? { x: i * (moodViewRange * 20 / (moodViewRange - 1)), y: 140 - ((d.mood - 1) / 4) * 120 - 10 } : null)
                      .filter(Boolean);
                    
                    if (points.length < 2) return null;
                    
                    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaData = pathData + ` L ${points[points.length-1].x} 140 L ${points[0].x} 140 Z`;
                    
                    return (
                      <>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E8976B" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#E8976B" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={areaData} fill="url(#moodGrad)" />
                        <path d={pathData} fill="none" stroke="#E8976B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#E8976B" strokeWidth="2" />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Y-axis labels */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#C0B0A0"
              }}>
                {getMoodDays(moodViewRange).filter((_, i, arr) => {
                  if (moodViewRange <= 7) return true;
                  if (moodViewRange <= 14) return i % 2 === 0;
                  return i % 5 === 0 || i === arr.length - 1;
                }).map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>

              {/* Average */}
              {getAverageMood(moodViewRange) && (
                <div style={{
                  marginTop: 14, padding: "10px 16px",
                  background: "rgba(232,151,107,0.06)", borderRadius: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13
                }}>
                  <span style={{ color: "#A8957F" }}>Average mood ({moodViewRange} days)</span>
                  <span style={{ color: "#C4764A", fontWeight: 600 }}>
                    {getAverageMood(moodViewRange)} / 5 {MOODS[Math.round(getAverageMood(moodViewRange)) - 1]?.emoji}
                  </span>
                </div>
              )}
            </div>

            {/* AI Weekly Insight */}
            <div className="card" style={{ animation: "fadeUp 0.7s ease-out" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16
              }}>
                <div style={{
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase", letterSpacing: 2,
                  color: "#8B7355", fontWeight: 600
                }}>
                  🧠 Weekly Insight
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                  background: "linear-gradient(135deg, rgba(107,162,107,0.15), rgba(107,162,107,0.05))",
                  padding: "4px 10px", borderRadius: 100,
                  color: "#5A8A5A", fontWeight: 600
                }}>
                  AI-POWERED
                </span>
              </div>

              {weeklyInsight ? (
                <div style={{ animation: "fadeUp 0.4s ease-out" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 14
                  }}>
                    <span style={{ fontSize: 36 }}>{weeklyInsight.emoji}</span>
                    <h3 style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: 20, color: "#3D3028", fontWeight: 400
                    }}>
                      {weeklyInsight.headline}
                    </h3>
                  </div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                    color: "#4A3F35", lineHeight: 1.6, marginBottom: 14
                  }}>
                    {weeklyInsight.insight}
                  </p>
                  <div style={{
                    padding: "12px 16px", background: "rgba(107,162,107,0.08)",
                    borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, color: "#5A8A5A"
                  }}>
                    💡 <strong>Next week:</strong> {weeklyInsight.suggestion}
                  </div>
                  <button onClick={() => { setWeeklyInsight(null); generateInsight(); }} style={{
                    marginTop: 14, padding: "8px 18px", borderRadius: 100,
                    border: "1px solid rgba(107,162,107,0.2)", background: "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                    color: "#7BA87B", cursor: "pointer"
                  }}>
                    Refresh insight
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    color: "#A8957F", marginBottom: 16
                  }}>
                    Get a personalized analysis of your mood patterns and journal entries.
                  </p>
                  <button onClick={generateInsight} disabled={insightLoading} style={{
                    padding: "12px 28px", borderRadius: 100, border: "none",
                    background: insightLoading ? "rgba(212,165,116,0.2)" : "linear-gradient(135deg, #6BA26B, #5A8A5A)",
                    color: insightLoading ? "#A8957F" : "white",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                    cursor: insightLoading ? "default" : "pointer"
                  }}>
                    {insightLoading ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white", borderRadius: "50%",
                          animation: "spin 0.8s linear infinite", display: "inline-block"
                        }} />
                        Analyzing your week...
                      </span>
                    ) : "Generate My Insight 🧠"}
                  </button>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="card" style={{ animation: "fadeUp 0.8s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 20, fontWeight: 600
              }}>
                Your Stats
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Current Streak", value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: "🔥", color: "#E8976B" },
                  { label: "Moods Logged", value: Object.keys(moodHistory).length, icon: "📊", color: "#6BA2E8" },
                  { label: "Journal Entries", value: Object.keys(journalEntries).length, icon: "📝", color: "#9B7DC8" },
                  { label: "Today's Challenge", value: challengeCompleted ? "Done!" : "Pending", icon: "⚡", color: "#6BA26B" },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: "16px", borderRadius: 18,
                    background: `${stat.color}08`,
                    border: `1px solid ${stat.color}15`,
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 20,
                      color: "#3D3028", fontWeight: 600, marginBottom: 2
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#A8957F"
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Journal History */}
            <div className="card" style={{ animation: "fadeUp 0.9s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 20, fontWeight: 600
              }}>
                Journal History
              </div>
              {getJournalDays().length === 0 ? (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: "#A8957F", textAlign: "center", padding: "20px 0"
                }}>
                  Your journal entries will appear here. Start by writing a gratitude or evening reflection!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {getJournalDays().map((entry, i) => {
                    const isExpanded = journalViewExpanded === entry.key;
                    const moodForDay = moodHistory[entry.key];
                    return (
                      <div key={i} 
                        onClick={() => setJournalViewExpanded(isExpanded ? null : entry.key)}
                        style={{
                          padding: "14px 18px", borderRadius: 16,
                          background: isExpanded ? "rgba(232,151,107,0.06)" : "rgba(255,255,255,0.4)",
                          border: "1px solid rgba(212,165,116,0.1)",
                          cursor: "pointer", transition: "all 0.3s"
                        }}
                      >
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>
                              {moodForDay ? MOODS[moodForDay - 1].emoji : "📝"}
                            </span>
                            <div>
                              <div style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                color: "#3D3028", fontWeight: 500
                              }}>
                                {entry.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              {!isExpanded && entry.gratitude && (
                                <div style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                  color: "#A8957F", marginTop: 2,
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  maxWidth: 220
                                }}>
                                  {entry.gratitude}
                                </div>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                            color: "#C0B0A0", transition: "transform 0.3s",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                          }}>
                            ▾
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={{
                            marginTop: 14, paddingTop: 14,
                            borderTop: "1px solid rgba(212,165,116,0.1)",
                            animation: "fadeUp 0.3s ease-out"
                          }}>
                            {entry.gratitude && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                                  color: "#C4764A", fontWeight: 600, marginBottom: 4,
                                  textTransform: "uppercase", letterSpacing: 1
                                }}>Gratitude</div>
                                <p style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                  color: "#4A3F35", lineHeight: 1.5
                                }}>{entry.gratitude}</p>
                              </div>
                            )}
                            {entry.wins && entry.wins.some(w => w && w.trim()) && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                                  color: "#C4764A", fontWeight: 600, marginBottom: 4,
                                  textTransform: "uppercase", letterSpacing: 1
                                }}>Wins</div>
                                {entry.wins.filter(w => w && w.trim()).map((w, j) => (
                                  <p key={j} style={{
                                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                    color: "#4A3F35", padding: "2px 0"
                                  }}>🏆 {w}</p>
                                ))}
                              </div>
                            )}
                            {entry.evening && (
                              <div>
                                {entry.evening.reflection && (
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{
                                      fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                                      color: "#9B7DC8", fontWeight: 600, marginBottom: 4,
                                      textTransform: "uppercase", letterSpacing: 1
                                    }}>Evening Reflection</div>
                                    <p style={{
                                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                      color: "#4A3F35", lineHeight: 1.5
                                    }}>{entry.evening.reflection}</p>
                                  </div>
                                )}
                                {entry.evening.rating && (
                                  <div style={{
                                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                    color: "#9B7DC8", marginTop: 6
                                  }}>
                                    Day rating: {entry.evening.rating}/10
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Motivational Message */}
            <div className="card" style={{
              textAlign: "center", animation: "fadeUp 1s ease-out",
              background: "linear-gradient(135deg, rgba(196,168,130,0.1), rgba(255,255,255,0.7))"
            }}>
              <p style={{
                fontSize: 18, color: "#3D3028", fontStyle: "italic", lineHeight: 1.5
              }}>
                {streak === 0 
                  ? "Every journey starts with a single step. Log your mood to begin your streak!"
                  : streak < 3 
                  ? "You're building something beautiful. Keep showing up for yourself."
                  : streak < 7
                  ? `${streak} days of choosing positivity. You're on fire! 🔥`
                  : `${streak} days strong. You're proof that consistency changes everything. 🌟`
                }
              </p>
            </div>
          </div>
        )}

        {/* ===== ACCOUNT TAB ===== */}
        {activeTab === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{
              textAlign: "center", animation: "fadeUp 0.5s ease-out",
              background: "linear-gradient(135deg, rgba(232,151,107,0.08), rgba(255,255,255,0.7))"
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
                background: user ? "linear-gradient(135deg, #E8976B, #D4764A)" : "rgba(212,165,116,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: user ? 28 : 32, color: "white", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700
              }}>
                {user ? (user.email?.[0]?.toUpperCase() || "U") : "👤"}
              </div>
              {user ? (
                <div>
                  <h2 style={{ fontSize: 22, color: "#3D3028", fontWeight: 400, marginBottom: 4 }}>
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "You"}
                  </h2>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: "#A8957F", marginBottom: 4
                  }}>
                    {user.email}
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(130,180,130,0.1)", padding: "4px 12px",
                    borderRadius: 100, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, color: "#5A8A5A", fontWeight: 500
                  }}>
                    ☁️ Synced to cloud
                  </div>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: "#8B7355", marginBottom: 16, fontWeight: 600
              }}>
                Your Journey
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Current Streak", value: `${streak} days`, icon: "🔥" },
                  { label: "Moods Logged", value: Object.keys(moodHistory).length, icon: "📊" },
                  { label: "Journal Entries", value: Object.keys(journalEntries).length, icon: "📝" },
                  { label: "Subscription", value: isPremium ? "Pro ✦" : "Free", icon: isPremium ? "💎" : "🌱" },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: 14, borderRadius: 16,
                    background: "rgba(255,255,255,0.5)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 18,
                      color: "#3D3028", fontWeight: 600
                    }}>{stat.value}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#A8957F"
                    }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade / Pro status */}
            <div className="card" style={{
              animation: "fadeUp 0.7s ease-out", cursor: "pointer",
              background: isPremium
                ? "linear-gradient(135deg, rgba(232,151,107,0.1), rgba(255,255,255,0.7))"
                : undefined
            }} onClick={() => setShowUpgrade(true)}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: isPremium
                    ? "linear-gradient(135deg, #E8976B, #D4764A)"
                    : "rgba(232,151,107,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22
                }}>
                  {isPremium ? "✦" : "⬆️"}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                    color: "#3D3028", fontWeight: 600, marginBottom: 2
                  }}>
                    {isPremium ? "Daily Shine Pro" : "Upgrade to Pro"}
                  </h3>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: "#A8957F"
                  }}>
                    {isPremium ? "Unlimited AI features active" : "Unlimited AI coaching, reframes & more"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            {user && (
              <button onClick={async () => { await signOut(); window.location.reload(); }} style={{
                padding: "14px", borderRadius: 100,
                border: "1px solid rgba(200,100,100,0.2)", background: "transparent",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A06050", cursor: "pointer", transition: "all 0.3s",
                animation: "fadeUp 0.8s ease-out"
              }}>
                Sign Out
              </button>
            )}

            {/* Back button */}
            <button onClick={() => setActiveTab("home")} style={{
              padding: "10px", background: "none", border: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: "#A8957F", cursor: "pointer", textAlign: "center"
            }}>
              ← Back to Today
            </button>
          </div>
        )}
      </div>

      {/* Welcome Guide */}
      {showWelcome && (() => {
        const welcomeSlides = [
          {
            icon: "🌟",
            title: "Welcome to Daily Shine",
            desc: "Your daily companion for positivity, mindfulness, and personal growth. Let's show you around!",
            color: "#E8976B"
          },
          {
            icon: "☀️",
            title: "Today Tab",
            desc: "Start each day with an affirmation, log your mood, complete a challenge, and write what you're grateful for. Your daily positivity ritual.",
            color: "#E8B86B"
          },
          {
            icon: "🧰",
            title: "Tools Tab",
            desc: "Powerful AI tools when you need support: an AI Coach to talk to, thought reframing, self-compassion letters, and a breathing exercise.",
            color: "#7BB88E"
          },
          {
            icon: "📖",
            title: "Learn Tab",
            desc: "Explore guides on mindfulness, gratitude, resilience, and emotional intelligence. Build your knowledge at your own pace.",
            color: "#6BA5C9"
          },
          {
            icon: "🌙",
            title: "Evening Tab",
            desc: "Wind down with evening reflections, rate your day, set tomorrow's intention, and let go of anything weighing you down.",
            color: "#9B7EC9"
          },
          {
            icon: "🌱",
            title: "Progress Tab",
            desc: "Track your mood patterns, review journal entries, and see weekly AI-powered insights about your emotional journey.",
            color: "#7BB88E"
          },
          {
            icon: "✨",
            title: "Free & Pro",
            desc: "You get 3 free AI uses per day. Upgrade to Pro for unlimited AI coaching, reframes, compassion letters, and insights — $4.99/mo.",
            color: "#E8976B"
          },
          {
            icon: "🚀",
            title: "You're all set!",
            desc: "Start by logging your mood on the Today tab. Every small step counts. Your positivity journey begins now!",
            color: "#D4764A"
          },
        ];
        const slide = welcomeSlides[welcomeStep];
        const isLast = welcomeStep === welcomeSlides.length - 1;
        const isFirst = welcomeStep === 0;

        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, animation: "fadeUp 0.3s ease-out"
          }}>
            <div style={{
              background: "linear-gradient(160deg, #FFF8F0, #FEF0E4)",
              borderRadius: 28, padding: 32, maxWidth: 380, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "fadeUp 0.4s ease-out",
              textAlign: "center"
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: `${slide.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 40,
                transition: "all 0.3s"
              }}>
                {slide.icon}
              </div>

              <h2 style={{
                fontSize: 22, color: "#3D3028", fontWeight: 400,
                marginBottom: 10, fontFamily: "'Playfair Display', serif"
              }}>
                {slide.title}
              </h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#6B5D4F", lineHeight: 1.6, marginBottom: 28
              }}>
                {slide.desc}
              </p>

              {/* Progress dots */}
              <div style={{
                display: "flex", justifyContent: "center", gap: 6, marginBottom: 20
              }}>
                {welcomeSlides.map((_, i) => (
                  <div key={i} style={{
                    width: i === welcomeStep ? 20 : 6,
                    height: 6, borderRadius: 3,
                    background: i === welcomeStep ? slide.color : "rgba(0,0,0,0.1)",
                    transition: "all 0.3s"
                  }} />
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                {!isFirst && (
                  <button onClick={() => setWelcomeStep(s => s - 1)} style={{
                    flex: 1, padding: "14px", borderRadius: 100,
                    border: "1px solid rgba(0,0,0,0.1)", background: "white",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    color: "#6B5D4F", cursor: "pointer", fontWeight: 500
                  }}>
                    Back
                  </button>
                )}
                <button onClick={() => {
                  if (isLast) {
                    localStorage.setItem("shine-welcome-seen-local", "true");
                    setShowWelcome(false);
                    setWelcomeStep(0);
                  } else {
                    setWelcomeStep(s => s + 1);
                  }
                }} style={{
                  flex: isFirst ? 1 : 1.5, padding: "14px", borderRadius: 100,
                  border: "none",
                  background: `linear-gradient(135deg, ${slide.color}, ${slide.color}DD)`,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: "white", cursor: "pointer", fontWeight: 600,
                  transition: "all 0.3s"
                }}>
                  {isLast ? "Let's Go! ☀️" : isFirst ? "Show Me Around" : "Next"}
                </button>
              </div>

              {isFirst && (
                <button onClick={() => {
                  localStorage.setItem("shine-welcome-seen-local", "true");
                  setShowWelcome(false);
                }} style={{
                  marginTop: 12, padding: "8px", border: "none",
                  background: "transparent", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, color: "#A8957F", cursor: "pointer"
                }}>
                  Skip — I'll explore on my own
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, animation: "fadeUp 0.3s ease-out"
        }} onClick={() => setShowUpgrade(false)}>
          <div style={{
            background: "linear-gradient(160deg, #FFF8F0, #FEF0E4)",
            borderRadius: 28, padding: 32, maxWidth: 400, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.4s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
              <h2 style={{ fontSize: 26, color: "#3D3028", fontWeight: 400, marginBottom: 8 }}>
                Unlock Daily Shine Pro
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#A8957F", lineHeight: 1.5
              }}>
                Unlimited AI-powered tools to support your growth every day.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { icon: "💬", text: "Unlimited AI Coach conversations" },
                { icon: "🔄", text: "Unlimited thought reframes" },
                { icon: "💌", text: "Unlimited compassion letters" },
                { icon: "🧠", text: "Unlimited weekly insights" },
                { icon: "⚡", text: "Priority AI responses" },
              ].map((perk, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: "rgba(255,255,255,0.6)",
                  borderRadius: 14
                }}>
                  <span style={{ fontSize: 20 }}>{perk.icon}</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4A3F35"
                  }}>{perk.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => {
              if (isPremium) {
                handleManageSubscription();
              } else {
                handleUpgrade();
              }
            }} disabled={upgradeLoading} style={{
              width: "100%", padding: "16px", borderRadius: 100, border: "none",
              background: isPremium
                ? "rgba(200,100,100,0.15)"
                : "linear-gradient(135deg, #E8976B, #D4764A)",
              color: isPremium ? "#A06050" : "white",
              fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600,
              cursor: upgradeLoading ? "wait" : "pointer", transition: "all 0.3s", marginBottom: 10,
              opacity: upgradeLoading ? 0.7 : 1,
            }}>
              {upgradeLoading ? "Redirecting to checkout..." : isPremium ? "Manage Subscription" : "Upgrade to Pro — $4.99/mo"}
            </button>

            {!isPremium && (
              <p style={{
                textAlign: "center", fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, color: "#A8957F"
              }}>
                Free users get {FREE_AI_LIMIT} AI uses per day
              </p>
            )}

            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "10px", borderRadius: 100,
              border: "none", background: "transparent",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: "#A8957F", cursor: "pointer"
            }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,248,240,0.9)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(212,165,116,0.15)",
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
        zIndex: 10
      }}>
        <div style={{
          maxWidth: 520, margin: "0 auto",
          display: "flex", justifyContent: "center", gap: 4, padding: "0 16px"
        }}>
          {[
            { id: "home", label: "Today", icon: "☀️" },
            { id: "tools", label: "Tools", icon: "🧰" },
            { id: "learn", label: "Learn", icon: "📖" },
            { id: "evening", label: "Evening", icon: "🌙" },
            { id: "history", label: "Progress", icon: "🌱" },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RandomActCard() {
  const [act, setAct] = useState(null);
  const acts = [
    "Leave a sticky note with a kind message somewhere public",
    "Buy a coffee for the person behind you in line",
    "Send a voice memo telling someone why they matter",
    "Leave a generous tip today",
    "Offer to help someone carry something",
    "Share a playlist with a friend",
    "Write a 5-star review for a small business you love",
    "Let someone go ahead of you in line",
    "Text an old friend just to say hi",
    "Pick up litter you see on your walk",
  ];

  const generate = () => {
    let newAct;
    do {
      newAct = acts[Math.floor(Math.random() * acts.length)];
    } while (newAct === act);
    setAct(newAct);
  };

  return (
    <div className="card" style={{ textAlign: "center", animation: "fadeUp 0.8s ease-out" }}>
      <div style={{
        fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        textTransform: "uppercase", letterSpacing: 2,
        color: "#8B7355", marginBottom: 20, fontWeight: 600
      }}>
        Random Act of Kindness
      </div>
      {act && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 16,
          color: "#3D3028", marginBottom: 20, lineHeight: 1.5,
          animation: "fadeUp 0.4s ease-out"
        }}>
          💛 {act}
        </p>
      )}
      <button onClick={generate} style={{
        padding: "12px 28px", borderRadius: 100, border: "none",
        background: "linear-gradient(135deg, #E8976B, #D4764A)",
        color: "white", fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "all 0.3s"
      }}>
        {act ? "Another One ✨" : "Generate an Act 💛"}
      </button>
    </div>
  );
}

function ReframeCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade }) {
  const [negativeThought, setNegativeThought] = useState("");
  const [reframedThought, setReframedThought] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [isAiMode, setIsAiMode] = useState(false);

  // Local fallback reframes — keyword-matched
  const LOCAL_REFRAMES = [
    { keywords: ["not good enough", "not enough", "inadequate", "worthless", "useless"], validation: "That feeling of not being enough is painful, and it's more common than you think.", reframe: "You don't have to be perfect to be valuable. Your worth isn't measured by productivity or achievements — it's inherent.", technique: "Self-Compassion Reframe", action: "Write down one thing you did well today, no matter how small." },
    { keywords: ["fail", "failure", "messed up", "screwed up", "ruined", "mistake"], validation: "Making mistakes feels terrible, especially when you care about doing well.", reframe: "Failure isn't the opposite of success — it's part of it. Every person you admire has a long list of failures you've never seen.", technique: "Growth Mindset Shift", action: "Ask yourself: what's one thing this taught me?" },
    { keywords: ["alone", "lonely", "no one", "nobody cares", "isolated"], validation: "Feeling disconnected is one of the most painful human experiences.", reframe: "Loneliness is a signal, not a life sentence. It means you value connection — and that capacity is still in you, waiting.", technique: "Evidence-Based Thinking", action: "Send one text to someone you haven't talked to in a while." },
    { keywords: ["anxious", "anxiety", "worried", "scared", "afraid", "panic", "nervous"], validation: "Anxiety is exhausting, and it's your brain trying to protect you — even when it overshoots.", reframe: "You've survived every anxious moment so far. This feeling is temporary, not a prediction of the future.", technique: "Decatastrophizing", action: "Take three slow breaths: in for 4, hold for 4, out for 6." },
    { keywords: ["hate myself", "hate my", "self-hate", "disgusting", "ugly", "stupid", "dumb", "idiot"], validation: "Being that harsh with yourself takes a real toll. You don't deserve that cruelty.", reframe: "Would you say this to someone you love? You deserve the same gentleness you'd give a friend in pain.", technique: "Cognitive Restructuring", action: "Look in the mirror and say one kind thing to yourself — even if it feels weird." },
    { keywords: ["can't", "impossible", "never", "hopeless", "give up", "stuck", "trapped"], validation: "Feeling stuck is incredibly frustrating, especially when you've been trying hard.", reframe: "Feeling stuck isn't the same as being stuck. Sometimes the path forward is just not visible yet — that doesn't mean it doesn't exist.", technique: "Decatastrophizing", action: "Identify one tiny step — not the whole solution, just one step." },
    { keywords: ["tired", "exhausted", "burnt out", "burnout", "overwhelmed", "too much"], validation: "Your exhaustion is real and valid — not a sign of weakness.", reframe: "Rest isn't quitting. Your body and mind are telling you something important. Listening to that is strength, not laziness.", technique: "Self-Compassion Reframe", action: "Give yourself permission to do 50% today. That's enough." },
    { keywords: ["behind", "falling behind", "everyone else", "comparison", "compared to"], validation: "Comparing yourself to others is natural, but it almost always distorts reality.", reframe: "You're comparing your behind-the-scenes to everyone else's highlight reel. Their timeline is not your timeline.", technique: "Cognitive Restructuring", action: "Unfollow one account that makes you feel behind." },
  ];

  const getLocalReframe = (thought) => {
    const lower = thought.toLowerCase();
    const match = LOCAL_REFRAMES.find(r => r.keywords.some(k => lower.includes(k)));
    return match || {
      validation: "What you're feeling right now is real, and it matters.",
      reframe: "This thought feels true right now, but feelings aren't facts. You've gotten through hard moments before — this one is no different.",
      technique: "Cognitive Restructuring",
      action: "Write this thought on paper, then write a kinder version next to it."
    };
  };

  const reframe = async () => {
    if (!negativeThought.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReframedThought(null);

    // If no AI access, use local immediately
    if (!canUseAI) {
      const local = getLocalReframe(negativeThought);
      setReframedThought(local);
      setIsAiMode(false);
      setHistory(prev => [...prev, { original: negativeThought.trim(), reframe: local }]);
      setLoading(false);
      return;
    }

    try {
      await trackAIUse();
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: `You are a warm, compassionate cognitive reframing coach inside a daily positivity app called Daily Shine. The user will share a negative thought, and your job is to help them see it from a healthier perspective.

Rules:
- Respond with ONLY a JSON object, no markdown, no backticks, no preamble
- The JSON should have these fields:
  - "validation": A short 1-sentence acknowledgment that their feeling is real and valid (max 20 words)
  - "reframe": A reframed version of their thought that is realistic, compassionate, and empowering (max 40 words). Don't be toxic-positive — be honest but kind.
  - "technique": The CBT technique name used (e.g., "Cognitive Restructuring", "Decatastrophizing", "Evidence-Based Thinking", "Self-Compassion Reframe", "Growth Mindset Shift")
  - "action": One tiny, concrete action they can take right now related to this thought (max 20 words)
  
Be warm but not cheesy. Be real. Sound like a wise friend, not a therapist robot.`,
          messages: [
            { role: "user", content: negativeThought.trim() }
          ]
        })
      });

      const data = await response.json();
      
      // If API returned fallback signal, use local reframe
      if (data.fallback) {
        const local = getLocalReframe(negativeThought);
        setReframedThought(local);
        setIsAiMode(false);
        setHistory(prev => [...prev, { original: negativeThought.trim(), reframe: local }]);
        setLoading(false);
        return;
      }

      const text = data.content.map(i => i.text || "").join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReframedThought(parsed);
      setIsAiMode(true);
      setHistory(prev => [...prev, { original: negativeThought.trim(), reframe: parsed }]);
    } catch (err) {
      // Fallback to local
      const local = getLocalReframe(negativeThought);
      setReframedThought(local);
      setIsAiMode(false);
      setHistory(prev => [...prev, { original: negativeThought.trim(), reframe: local }]);
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ animation: "fadeUp 0.75s ease-out" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase", letterSpacing: 2,
          color: "#8B7355", fontWeight: 600
        }}>
          🔄 Reframe It
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: aiUsesLeft > 0 ? "rgba(130,180,130,0.12)" : "rgba(200,100,100,0.12)",
              padding: "4px 8px", borderRadius: 100,
              color: aiUsesLeft > 0 ? "#5A8A5A" : "#A06050", fontWeight: 600
            }}>
              {aiUsesLeft > 0 ? `${aiUsesLeft} free` : "Local mode"}
            </span>
          )}
          {isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))",
              padding: "4px 8px", borderRadius: 100,
              color: "#C4764A", fontWeight: 600
            }}>
              ✦ PRO
            </span>
          )}
        </div>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        color: "#A8957F", marginBottom: 16, lineHeight: 1.5
      }}>
        Type a negative thought and get a healthier perspective.
      </p>

      <textarea
        value={negativeThought}
        onChange={e => setNegativeThought(e.target.value)}
        placeholder={`e.g., "I'm not good enough" or "Everything always goes wrong"`}
        style={{
          width: "100%", minHeight: 72, padding: 16,
          background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
          borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: "#4A3F35", resize: "vertical",
          outline: "none", transition: "border-color 0.3s"
        }}
        onFocus={e => e.target.style.borderColor = "rgba(107,162,232,0.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(212,165,116,0.2)"}
      />

      <button onClick={reframe} disabled={loading || !negativeThought.trim()} style={{
        marginTop: 12, padding: "12px 28px", borderRadius: 100,
        border: "none",
        background: (negativeThought.trim() && !loading)
          ? "linear-gradient(135deg, #6BA2E8, #5B8AC4)"
          : "rgba(212,165,116,0.2)",
        color: (negativeThought.trim() && !loading) ? "white" : "#A8957F",
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
        cursor: (negativeThought.trim() && !loading) ? "pointer" : "default",
        transition: "all 0.3s", width: "100%"
      }}>
        {loading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", display: "inline-block"
            }} />
            Reframing your thought...
          </span>
        ) : "Reframe This Thought 🔄"}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{
          marginTop: 16, padding: 14, background: "rgba(200,100,100,0.08)",
          borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, color: "#A0605F", textAlign: "center"
        }}>
          {error}
        </div>
      )}

      {reframedThought && (
        <div style={{
          marginTop: 20, animation: "fadeUp 0.5s ease-out"
        }}>
          {/* Validation */}
          <div style={{
            padding: "14px 18px", background: "rgba(196,168,130,0.08)",
            borderRadius: 16, marginBottom: 12,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: "#8B7355", fontStyle: "italic"
          }}>
            💛 {reframedThought.validation}
          </div>

          {/* Reframed thought */}
          <div style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, rgba(107,162,232,0.08), rgba(130,180,130,0.08))",
            borderRadius: 20, marginBottom: 12,
            border: "1px solid rgba(107,162,232,0.12)"
          }}>
            <div style={{
              fontSize: 10, fontFamily: "'DM Sans', sans-serif",
              textTransform: "uppercase", letterSpacing: 2,
              color: "#5B8AC4", marginBottom: 10, fontWeight: 600
            }}>
              Reframed Perspective
            </div>
            <p style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 19, color: "#3D3028", lineHeight: 1.5,
              fontStyle: "italic"
            }}>
              "{reframedThought.reframe}"
            </p>
          </div>

          {/* Technique badge + Action */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 10
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                background: "rgba(107,162,232,0.1)", padding: "5px 12px",
                borderRadius: 100, color: "#5B8AC4", fontWeight: 500
              }}>
                🧠 {reframedThought.technique}
              </span>
            </div>
            <div style={{
              padding: "12px 16px", background: "rgba(130,180,130,0.08)",
              borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: "#5A8A5A"
            }}>
              ⚡ <strong>Try this:</strong> {reframedThought.action}
            </div>
          </div>

          {/* Reset button */}
          <button onClick={() => { setNegativeThought(""); setReframedThought(null); }} style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 100,
            border: "1px solid rgba(212,165,116,0.2)", background: "transparent",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: "#A8957F", cursor: "pointer", transition: "all 0.3s"
          }}>
            Reframe another thought
          </button>
        </div>
      )}

      {/* History count */}
      {history.length > 1 && (
        <div style={{
          marginTop: 16, textAlign: "center",
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#A8957F"
        }}>
          You've reframed {history.length} thoughts today ✨
        </div>
      )}
    </div>
  );
}

function CompassionCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade }) {
  const [situation, setSituation] = useState("");
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);

  const LOCAL_LETTERS = [
    { greeting: "Hey, I see you right now.", body: "What you're going through is hard, and it's okay to feel the weight of it. You don't have to have it all figured out today. Just being here, still trying — that says more about your strength than you realize.", closing: "With all the kindness you deserve,", signature: "Your Kinder Self" },
    { greeting: "Hi, I know today is heavy.", body: "You're carrying more than most people see, and that takes real courage. Give yourself the same grace you'd give your best friend. You're not falling apart — you're being human.", closing: "Gently and with love,", signature: "The Part of You That Knows Better" },
    { greeting: "Hey, take a breath with me.", body: "Whatever happened today doesn't define you. You've been through hard things before and you're still here. That resilience? It's not nothing — it's everything.", closing: "You've got this. I promise.", signature: "Your Compassionate Side" },
    { greeting: "I know you're being hard on yourself.", body: "But here's what I see: someone who cares deeply, tries their best, and holds themselves to a standard they'd never impose on anyone else. Ease up. You deserve your own kindness.", closing: "With warmth and no judgment,", signature: "Your Wiser Self" },
    { greeting: "Hey, it's okay to not be okay.", body: "You don't need to perform strength right now. Sometimes the bravest thing is admitting you're struggling. Tomorrow will come with its own energy — for now, just let yourself be where you are.", closing: "Always in your corner,", signature: "Your Kinder Self" },
  ];

  const getLocalLetter = () => LOCAL_LETTERS[Math.floor(Math.random() * LOCAL_LETTERS.length)];

  const generateLetter = async () => {
    if (!situation.trim() || loading) return;
    setLoading(true);
    setLetter(null);

    if (!canUseAI) {
      setLetter(getLocalLetter());
      setLoading(false);
      return;
    }

    try {
      await trackAIUse();
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: `You are a self-compassion coach inside a positivity app. The user will describe something they're struggling with or feeling bad about. Write them a short, warm letter FROM their most compassionate self TO them.

Rules:
- Respond with ONLY a JSON object, no markdown, no backticks
- JSON fields:
  - "greeting": A warm opening line addressing them (max 10 words, e.g., "Hey, I see you struggling right now.")
  - "body": The compassion letter, 2-3 sentences max. Acknowledge their pain, remind them of their humanity, offer perspective. Be real, not saccharine.
  - "closing": A loving sign-off (max 8 words, e.g., "With all the love you deserve,")
  - "signature": "Your Kinder Self" or similar

Sound like a wise, warm friend who knows them deeply. No toxic positivity.`,
          messages: [
            { role: "user", content: situation.trim() }
          ]
        })
      });

      const data = await response.json();
      
      if (data.fallback) {
        setLetter(getLocalLetter());
        setLoading(false);
        return;
      }

      const text = data.content.map(i => i.text || "").join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      setLetter(JSON.parse(clean));
    } catch {
      setLetter(getLocalLetter());
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ animation: "fadeUp 0.85s ease-out" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase", letterSpacing: 2,
          color: "#8B7355", fontWeight: 600
        }}>
          💌 Self-Compassion Letter
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: aiUsesLeft > 0 ? "rgba(130,180,130,0.12)" : "rgba(200,100,100,0.12)",
              padding: "4px 8px", borderRadius: 100,
              color: aiUsesLeft > 0 ? "#5A8A5A" : "#A06050", fontWeight: 600
            }}>
              {aiUsesLeft > 0 ? `${aiUsesLeft} free` : "Local mode"}
            </span>
          )}
          {isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: "linear-gradient(135deg, rgba(180,130,196,0.15), rgba(180,130,196,0.05))",
              padding: "4px 8px", borderRadius: 100,
              color: "#9B6AAF", fontWeight: 600
            }}>
              ✦ PRO
            </span>
          )}
        </div>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        color: "#A8957F", marginBottom: 16, lineHeight: 1.5
      }}>
        What are you being hard on yourself about? Let your kinder self write you a letter.
      </p>

      {!letter ? (
        <div>
          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder={`e.g., "I feel like I wasted my whole day" or "I keep making the same mistakes"`}
            style={{
              width: "100%", minHeight: 72, padding: 16,
              background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
              borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: "#4A3F35", resize: "vertical",
              outline: "none", transition: "border-color 0.3s"
            }}
            onFocus={e => e.target.style.borderColor = "rgba(180,130,196,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(212,165,116,0.2)"}
          />
          <button onClick={generateLetter} disabled={loading || !situation.trim()} style={{
            marginTop: 12, padding: "12px 28px", borderRadius: 100,
            border: "none",
            background: (situation.trim() && !loading)
              ? "linear-gradient(135deg, #B882C8, #9B6AAF)"
              : "rgba(212,165,116,0.2)",
            color: (situation.trim() && !loading) ? "white" : "#A8957F",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            cursor: (situation.trim() && !loading) ? "pointer" : "default",
            transition: "all 0.3s", width: "100%"
          }}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", display: "inline-block"
                }} />
                Writing your letter...
              </span>
            ) : "Write Me a Letter 💌"}
          </button>
        </div>
      ) : (
        <div style={{
          animation: "fadeUp 0.5s ease-out",
          background: "linear-gradient(135deg, rgba(180,130,196,0.06), rgba(255,255,255,0.6))",
          border: "1px solid rgba(180,130,196,0.12)",
          borderRadius: 20, padding: "24px 22px"
        }}>
          <p style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 17, color: "#6B4A7A", marginBottom: 14,
            fontStyle: "italic"
          }}>
            {letter.greeting}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: "#4A3F35", lineHeight: 1.7, marginBottom: 18
          }}>
            {letter.body}
          </p>
          <p style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 15, color: "#9B6AAF", fontStyle: "italic",
            marginBottom: 4
          }}>
            {letter.closing}
          </p>
          <p style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 16, color: "#6B4A7A", fontWeight: 400
          }}>
            — {letter.signature}
          </p>

          <button onClick={() => { setSituation(""); setLetter(null); }} style={{
            marginTop: 18, padding: "8px 20px", borderRadius: 100,
            border: "1px solid rgba(180,130,196,0.2)", background: "transparent",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: "#9B6AAF", cursor: "pointer", transition: "all 0.3s"
          }}>
            Write another letter
          </button>
        </div>
      )}
    </div>
  );
}

function AskCoachCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const LOCAL_ANSWERS = [
    "That's a great question. Here's what I'd suggest: start with the smallest possible step. Don't try to solve everything at once — just do one tiny thing today that moves you in the right direction. Momentum builds from there.",
    "I hear you. When things feel heavy, remember this: you don't have to figure it all out right now. Give yourself permission to take it one day at a time. That's not weakness — it's wisdom.",
    "Here's something that might help: write down exactly what's bothering you, then ask 'What would I tell my best friend in this situation?' We're usually kinder and wiser when advising others. Turn that compassion inward.",
    "That's something a lot of people struggle with. Try the 2-minute rule: if something takes less than 2 minutes, do it now. If it's bigger, just commit to working on it for 2 minutes. Starting is the hardest part.",
    "I think the most important thing here is to be honest with yourself about what you actually want — not what you think you should want. When you align your actions with your real values, things start to feel easier.",
    "It sounds like you might be overthinking this. Sometimes the best move is to stop analyzing and just take action. You can always course-correct later. Perfection isn't the goal — movement is.",
  ];

  const askCoach = async () => {
    if (!question.trim() || loading) return;
    const userQ = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: userQ }]);
    setLoading(true);

    if (!canUseAI) {
      const local = LOCAL_ANSWERS[Math.floor(Math.random() * LOCAL_ANSWERS.length)];
      setMessages(prev => [...prev, { role: "coach", text: local, isLocal: true }]);
      setLoading(false);
      return;
    }

    try {
      await trackAIUse();
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      }));
      conversationHistory.push({ role: "user", content: userQ });

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: `You are a warm, wise positivity coach inside an app called Daily Shine. Users come to you with questions about life, mindset, motivation, relationships, stress, self-improvement, and wellbeing.

Rules:
- Keep answers to 2-4 sentences max
- Be warm, direct, and practical — like a wise friend, not a therapist
- Give actionable advice when possible
- No toxic positivity — be honest but kind
- If someone seems to be in crisis, gently suggest they talk to a professional or trusted person
- Never diagnose or prescribe medical/psychological treatment`,
          messages: conversationHistory
        })
      });

      const data = await response.json();
      
      if (data.fallback) {
        const local = LOCAL_ANSWERS[Math.floor(Math.random() * LOCAL_ANSWERS.length)];
        setMessages(prev => [...prev, { role: "coach", text: local, isLocal: true }]);
        setLoading(false);
        return;
      }

      const text = data.content.map(i => i.text || "").join("\n").trim();
      setMessages(prev => [...prev, { role: "coach", text, isLocal: false }]);
    } catch {
      const local = LOCAL_ANSWERS[Math.floor(Math.random() * LOCAL_ANSWERS.length)];
      setMessages(prev => [...prev, { role: "coach", text: local, isLocal: true }]);
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ animation: "fadeUp 0.65s ease-out" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase", letterSpacing: 2,
          color: "#8B7355", fontWeight: 600
        }}>
          💬 Ask Your Coach
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: aiUsesLeft > 0 ? "rgba(130,180,130,0.12)" : "rgba(200,100,100,0.12)",
              padding: "4px 10px", borderRadius: 100,
              color: aiUsesLeft > 0 ? "#5A8A5A" : "#A06050", fontWeight: 600
            }}>
              {aiUsesLeft > 0 ? `${aiUsesLeft} free left today` : "Limit reached"}
            </span>
          )}
          {isPremium && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              background: "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))",
              padding: "4px 10px", borderRadius: 100,
              color: "#C4764A", fontWeight: 600
            }}>
              ✦ PRO
            </span>
          )}
        </div>
      </div>

      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        color: "#A8957F", marginBottom: 16, lineHeight: 1.5
      }}>
        Ask anything about mindset, motivation, stress, or life — your personal positivity coach is here.
      </p>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: 300, overflowY: "auto", marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 10,
          padding: "4px 0"
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "85%", padding: "12px 16px", borderRadius: 18,
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #E8976B, #D4A574)"
                  : "rgba(255,255,255,0.7)",
                color: msg.role === "user" ? "white" : "#4A3F35",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                lineHeight: 1.5,
                borderBottomRightRadius: msg.role === "user" ? 6 : 18,
                borderBottomLeftRadius: msg.role === "coach" ? 6 : 18,
                border: msg.role === "coach" ? "1px solid rgba(212,165,116,0.15)" : "none",
                animation: "fadeUp 0.3s ease-out"
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{
              display: "flex", justifyContent: "flex-start"
            }}>
              <div style={{
                padding: "12px 20px", borderRadius: 18, borderBottomLeftRadius: 6,
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(212,165,116,0.15)",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#A8957F"
              }}>
                <span style={{ animation: "pulseGlow 1.5s ease-in-out infinite" }}>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askCoach()}
          placeholder={canUseAI ? "Ask me anything..." : "Ask me anything (local mode)..."}
          style={{
            flex: 1, padding: "12px 16px",
            background: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,165,116,0.2)",
            borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: "#4A3F35", outline: "none"
          }}
        />
        <button onClick={askCoach} disabled={loading || !question.trim()} style={{
          width: 48, height: 48, borderRadius: 16, border: "none", flexShrink: 0,
          background: (question.trim() && !loading)
            ? "linear-gradient(135deg, #E8976B, #D4764A)"
            : "rgba(212,165,116,0.2)",
          color: (question.trim() && !loading) ? "white" : "#A8957F",
          fontSize: 18, cursor: (question.trim() && !loading) ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s"
        }}>
          ↑
        </button>
      </div>

      {/* Upgrade nudge */}
      {!isPremium && aiUsesLeft === 0 && (
        <button onClick={onUpgrade} style={{
          marginTop: 14, width: "100%", padding: "12px", borderRadius: 100,
          border: "none",
          background: "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: "#C4764A", fontWeight: 500, cursor: "pointer"
        }}>
          ✦ Upgrade to Pro for unlimited AI coaching
        </button>
      )}
    </div>
  );
}
