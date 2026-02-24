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
  "Today, choose to be your own best friend.",
  "Your worth isn't measured by how much you produce.",
  "It's okay to ask for help. Strength includes that.",
  "You've already come so far. Look back and see.",
  "Your voice deserves to be heard.",
  "Every day you show up is a victory.",
  "You don't have to earn rest. Rest is your right.",
  "Mistakes are proof you're trying something new.",
  "You are allowed to change your mind.",
  "Your body is doing its best for you today.",
  "You are worthy of love exactly as you are.",
  "Today holds something good, even if you can't see it yet.",
  "You are not behind. You are on your own timeline.",
  "Your feelings don't need a reason to be valid.",
  "One kind thought about yourself changes the whole day.",
  "You have handled hard things before, and you will again.",
  "Being yourself is the most powerful thing you can do.",
  "You are not responsible for fixing everything.",
  "Something beautiful is possible today.",
  "Your effort counts, even when the results aren't visible yet.",
  "You are worthy of good things happening to you.",
  "It's okay if today is just about getting through it.",
  "Your past does not define your potential.",
  "You are stronger than the story you tell about yourself.",
  "Choosing yourself is not selfish. It's necessary.",
  "You bring something to this world no one else can.",
  "Today you get to start again.",
  "Your kindness matters more than you know.",
  "You don't have to figure everything out at once.",
  "Right now, you are exactly enough.",
  "Your growth is happening, even when it's invisible.",
  "You are allowed to feel joy even when things aren't perfect.",
  "Every small act of self-care is an act of courage.",
  "You are worthy of patience, especially from yourself.",
  "Today is a new canvas. Paint it gently.",
  "You have survived every bad day so far. That's a record.",
  "Your sensitivity is a strength, not a weakness.",
  "You matter to people you haven't even met yet.",
  "It's okay to move slowly. Slow is still moving.",
  "You deserve a full, rich, happy life.",
  "The best is not behind you. There's still so much ahead.",
  "You don't need to be fixed. You need to be loved.",
  "Your boundaries are an act of self-respect.",
  "Today, notice one thing that's going right.",
  "You are not too much. You are just right.",
  "Your curiosity is one of your greatest gifts.",
  "It's brave to feel things deeply.",
  "You are more than your to-do list.",
  "Every day you choose kindness is a good day.",
  "You are capable of more than fear tells you.",
  "Rest today so you can rise tomorrow.",
  "You are deserving of the dreams in your heart.",
  "Your hard work will pay off, even if it's not today.",
  "You are not alone in what you're feeling.",
  "Today, let yourself be imperfect and still proud.",
  "Your presence in someone's life makes a real difference.",
  "You are allowed to outgrow old versions of yourself.",
  "The world is better with you in it.",
  "You are doing better than you think.",
  "It's okay to not have all the answers right now.",
  "Your love and care ripple out further than you'll ever see.",
  "You are resilient. Life has proven that already.",
  "Today, let compassion start with yourself.",
  "You deserve to feel proud of how far you've come.",
  "Growth is uncomfortable, and you are growing.",
  "You are not stuck. You are building.",
  "Everything you need is already inside you.",
  "Today, give yourself permission to be human.",
  "Your story has chapters you haven't read yet.",
  "You are a work in progress, and that's a beautiful thing.",
  "Setbacks are setups for something better.",
  "You are worthy of the love you so freely give to others.",
  "Today, one small win is all you need.",
  "You are not failing. You are figuring it out.",
  "The most important relationship you have is with yourself.",
  "You are allowed to want more for your life.",
  "Your struggles do not cancel out your gifts.",
  "Today, be the friend to yourself you wish you had.",
  "You carry more wisdom than you give yourself credit for.",
  "It's okay to feel proud of ordinary days.",
  "Your instincts are worth trusting.",
  "You don't have to be everything to everyone.",
  "Today, let yourself receive as freely as you give.",
  "You are safe to feel whatever you feel right now.",
  "You have permission to take up space in your own life.",
  "Your best is enough, even on days when it doesn't feel like it.",
  "You are not too late. The right time is always now.",
  "Today, notice how far you've traveled.",
  "You are worthy of a life that excites you.",
  "Your effort, even when it's quiet, matters.",
  "It's okay to be a beginner at something.",
  "You are loved more than you realize.",
  "Today, choose one thing that fills you up.",
  "You are building something, even on the days it doesn't feel like it.",
  "Your gentleness is a power, not a weakness.",
  "You don't have to explain your needs to deserve them met.",
  "Today, let one thing be easy.",
  "You are allowed to feel hopeful.",
  "Your life is full of possibility right now.",
  "It's enough to do one good thing today.",
  "You are more capable than your self-doubt suggests.",
  "Today is a good day to believe in yourself.",
  "You have the right to rest without guilt.",
  "Your perspective is valuable and worth sharing.",
  "You are not responsible for everyone else's feelings.",
  "Today, honor where you are without wishing you were somewhere else.",
  "You are enough on the quiet days too.",
  "Your journey is valid even without an audience.",
  "It's okay to need more than you're getting.",
  "You deserve to be treated the way you treat others.",
  "Today, celebrate something small about yourself.",
  "You are not what happened to you.",
  "Your resilience is written in everything you've survived.",
  "It's okay to feel proud without needing permission.",
  "You are allowed to dream as big as you want.",
  "Today, lead with the best version of yourself.",
  "You have gifts that the world genuinely needs.",
  "Your heart is one of your best features.",
  "It's okay to take things one hour at a time.",
  "You are not behind. You are exactly on time.",
  "Today, let love start with the person in the mirror.",
  "You have more courage than you've been told.",
  "Your experiences have shaped something truly unique in you.",
  "It's okay to be proud of small things.",
  "You don't have to hustle for your worth.",
  "Today, let kindness start from within.",
  "You matter, and your presence changes things.",
  "Your growth is yours. No one can take it from you.",
  "It's okay to be a work in progress.",
  "You are allowed to feel peace even when things aren't resolved.",
  "Today, trust yourself just a little more than yesterday.",
  "You are exactly the person someone needs in their life.",
  "Your best days are not all behind you.",
  "It's okay to lean on someone today.",
  "You are allowed to feel everything you feel.",
  "Today, give yourself credit before you give it to anyone else.",
  "You are not what you fear you are.",
  "Your good intentions mean something.",
  "It's okay to start over. That's not failure.",
  "You deserve to take your own breath away.",
  "Today, be as kind to yourself as you are to others.",
  "You are worthy of calm.",
  "Your creativity is a superpower.",
  "It's okay to say I don't know. That's honesty.",
  "You are doing something important just by showing up.",
  "Today, let your softness be your strength.",
  "You have a right to feel good about yourself.",
  "Your thoughtfulness is a rare and valuable thing.",
  "It's okay to forgive yourself quickly.",
  "You are allowed to take breaks without explanation.",
  "Today, acknowledge one thing you did well yesterday.",
  "You are not your anxiety. You are more than that.",
  "Your love for others reflects the depth of your heart.",
  "It's okay for today to just be okay.",
  "You deserve to feel comfortable in your own skin.",
  "Today, let what you have be enough.",
  "You are still becoming, and that's exciting.",
  "Your consistency, even when it's quiet, is building something.",
  "It's okay to feel nervous and do it anyway.",
  "You are allowed to be proud of yourself right now.",
  "Today, let yourself be seen.",
  "You carry more than you let anyone see. Be proud of that.",
  "Your empathy makes the world softer for others.",
  "It's okay to be uncertain. Certainty is overrated.",
  "You are not a burden. You are a gift.",
  "Today, let yourself be held by something gentle.",
  "You have everything inside you to face today.",
  "Your warmth is contagious in the best way.",
  "It's okay to want things for yourself.",
  "You are allowed to take up time as well as space.",
  "Today, believe in the version of you who already made it.",
  "You are resilient in ways you haven't even tested yet.",
  "Your desire to grow is already growth.",
  "It's okay to change direction when something isn't working.",
  "You are not a failure. You are in the middle of the story.",
  "Today, one act of self-love can change everything.",
  "You deserve the good things you wish for others.",
  "Your courage shows up in ways you don't even notice.",
  "It's okay to feel the weight of things and still keep going.",
  "You are bigger than the worst thought you've had today.",
  "Today, let yourself rest in the knowledge that you're enough.",
  "You don't have to be strong every day.",
  "Your healing is happening even on the hardest days.",
  "It's okay to not be productive. Being is enough.",
  "You are allowed to feel joy today, right now, as you are.",
  "Today, let something delight you.",
  "You are on a path that is entirely your own, and it's right.",
  "Your love, your care, your effort — they all matter.",
  "It's okay to trust the process, even when it's slow.",
  "You are one small decision away from a better day.",
  "Today, choose yourself without apology.",
  "You are loved, even when you forget to remember it.",
  "Your life is worth showing up for fully.",
  "It's okay to feel both broken and whole at the same time.",
  "You are capable of creating real change in your own life.",
  "Today, let hope take up more room than fear.",
  "You are not finished. You are just getting started.",
  "Your compassion for others begins with compassion for yourself.",
  "It's okay to not be the same person you were a year ago.",
  "You are always in the process of becoming something wonderful.",
  "Today, let yourself be exactly who you are.",
  "You have something to offer that no one else can.",
  "Your pace is the right pace for you.",
  "It's okay to ask for what you need without shame.",
  "You are allowed to feel both grateful and wanting more.",
  "Today, trust that your efforts are not wasted.",
  "You are more loved and more needed than you know.",
  "Your honesty with yourself is a form of bravery.",
  "It's okay to be in the middle of your healing.",
  "You are always worthy, even on the days you don't feel it.",
  "Today, notice the goodness that already surrounds you.",
  "You are becoming who you were always meant to be.",
  "Your tenderness is not a flaw. It's a feature.",
  "It's okay to feel sad and still know things will be okay.",
  "You are resilient in ways the world hasn't even seen yet.",
  "Today, let curiosity lead you somewhere new.",
  "You are not a problem to be solved. You are a person to be loved.",
  "Your effort, your care, your showing up — it counts.",
  "It's okay to let today be the beginning.",
  "You are allowed to feel proud of who you are.",
  "Today, remember: you are enough, you have enough, you do enough.",
  "You are safe to grow at your own pace.",
  "Your willingness to try again is extraordinary.",
  "It's okay to feel hopeful even when things are hard.",
  "You deserve gentleness, especially from yourself.",
  "Today, let the small things be enough.",
  "You are always allowed to begin again.",
  "Your feelings make you human, not weak.",
  "It's okay to not have your whole life figured out.",
  "You are worth every investment of time and energy you put into yourself.",
  "Today, find one moment of stillness just for you.",
  "You are not behind. You are perfectly positioned.",
  "Your story is still being written, and the best parts are ahead.",
  "It's okay to rest your heart today.",
  "You are more than enough for today.",
  "Today, let tomorrow take care of itself.",
  "You carry every version of yourself that got you here. Honor them.",
  "Your presence alone is valuable.",
  "It's okay to be proud of just existing today.",
  "You are worthy of every good thing you hope for.",
  "Today, be kind to yourself first.",
  "You are allowed to feel complete even in your incompleteness.",
  "Your joy is worth protecting.",
  "It's okay to let something difficult go today.",
  "You are enough for this moment.",
  "Today, notice what makes you feel most alive.",
  "You are building a life worth living, one day at a time.",
  "Your presence in the world matters more than you know.",
  "It's okay to feel your feelings fully and still function.",
  "You deserve to experience life with full presence and joy.",
  "Today, give yourself permission to be whole.",
  "You are worthy of support, rest, and deep nourishment.",
  "Your light has not gone out. It is just resting.",
  "It's okay to be in the becoming.",
  "You are not alone. You never were.",
  "Today, choose the thought that makes you feel most alive.",
  "You are full of potential that hasn't yet been tapped.",
  "Your courage is quiet sometimes, and still real.",
  "It's okay to love yourself imperfectly.",
  "You are always growing, even when you can't see it.",
  "Today, let gratitude be your first feeling.",
  "You are worthy of the life you imagine for yourself.",
  "Your inner world is rich and worth exploring.",
  "It's okay to not be okay and still show up.",
  "You are allowed to feel wonderful today.",
  "Today, be the energy you wish to receive.",
  "You have survived everything life has thrown at you. That's strength.",
  "Your heart knows the way. Trust it.",
  "It's okay to take a different path than you planned.",
  "You are allowed to bloom in your own season.",
  "Today, let yourself believe something wonderful is possible.",
  "You are a living, breathing miracle doing your best.",
  "Your commitment to yourself is the foundation of everything.",
  "It's okay to love yourself loudly.",
  "You are exactly where growth happens.",
  "Today, be gentle with your own beginning.",
  "You are worthy of celebrating, right now, as you are.",
  "Your quiet strength moves mountains.",
  "It's okay to not know what comes next.",
  "You are always enough, even when you forget.",
  "Today, let today be good enough.",
  "You are full of untapped capability waiting to surprise you.",
  "Your needs are valid and worth meeting.",
  "Today, let your choices reflect your values.",
  "You are not a burden — you are a gift.",
  "Your softness is a form of strength.",
  "Today, trust the quiet voice inside you.",
  "You don't have to be anyone other than who you already are.",
  "Your commitment to growing makes you remarkable.",
  "It's okay to not have it all together today.",
  "You are worthy of being seen and heard.",
  "Today, give yourself the benefit of the doubt.",
  "Your pace is not a problem. It's wisdom.",
  "You are allowed to change without explanation.",
  "Today, let what matters most lead the way.",
  "You are more whole than you feel on hard days.",
  "Your instincts have guided you well before. Trust them again.",
  "It's okay to feel pride in small accomplishments.",
  "You carry the resilience of everyone who came before you.",
  "Today, make one decision that honors who you're becoming.",
  "Your dreams are not too big. They're exactly right.",
  "You are allowed to rest in the present moment.",
  "Every version of yourself has done something worth honoring.",
  "Today, be patient with yourself the way you would with a child.",
  "You don't need to prove your worth to anyone, including yourself.",
  "Your life has texture, depth, and meaning.",
  "It's okay to be proud of who you're working to become.",
  "You are not the sum of your bad days.",
  "Today, let your effort be enough — even if the outcome isn't.",
  "Your willingness to feel is a courageous thing.",
  "You are exactly as far along as you need to be.",
  "It's okay to be uncertain and still take the next step.",
  "You bring warmth into spaces without always knowing it.",
  "Today, be proud of yourself for showing up again.",
  "Your love for others starts with loving yourself.",
  "You are not behind. Everyone is on their own road.",
  "It's okay to take the long way. The long way is still forward.",
  "You have done harder things than today's challenge.",
  "Your sensitivity makes you someone people want to be near.",
  "Today, lead with what you know is true about yourself.",
  "You are allowed to want peace as much as you want success.",
  "It's okay to start over. The ground is always there to catch you.",
  "You are a person worthy of deep, steady love.",
  "Today, let joy be a priority, not an afterthought.",
  "Your consistency, even when unnoticed, is building everything.",
  "It's okay to not be in a hurry.",
  "You are never too broken to be put back together.",
  "Today, give yourself full credit for making it this far.",
  "Your story is yours to write — no one else gets to hold the pen.",
  "It's okay to feel hopeful even when things aren't resolved.",
  "You deserve a life that feels like yours.",
  "Today, honor your limits as much as your potential.",
  "You are always capable of being kind — start with yourself.",
  "It's okay to feel lost. Being lost is part of finding your way.",
  "You have gifts that will only fully bloom in your own time.",
  "Today, let the good in your life be loud.",
  "You are worthy of being someone's first call on a hard day.",
  "It's okay to disagree with the version of yourself from yesterday.",
  "You are growing in ways you cannot yet see.",
  "Today, honor both how far you've come and how far you'll go.",
  "Your love and intention ripple out further than you'll ever know.",
  "It's okay to be excellent at ordinary things.",
  "You are not your fear. You are the one who faces it.",
  "Today, remember that being is just as valuable as doing.",
  "Your presence changes the temperature of a room for the better.",
  "It's okay to rest deeply and completely, without guilt.",
  "You are allowed to feel whole right now, not just when things are fixed.",
  "Today, be the version of yourself you'd be proud to introduce.",
  "Your emotions are data, not destiny.",
  "It's okay to feel more than one thing at once.",
  "You are a human doing the best you can with what you have.",
  "Today, choose one area where you'll give yourself more grace.",
  "Your goodness is quiet but real and consistent.",
  "It's okay to grieve what didn't work out and still move forward.",
  "You are held by more love than you realize.",
  "Today, let your story be enough — exactly as it is.",
  "Your courage is not loud. It's in the choices no one sees.",
  "It's okay to be in a season of learning rather than achieving.",
  "You are more than what you produce or accomplish.",
  "Today, let yourself feel genuinely good about who you are.",
  "Your honesty with yourself takes real bravery.",
  "It's okay to acknowledge your hard days without letting them define you.",
  "You are allowed to outgrow the life that no longer fits.",
  "Today, let love be the energy you lead with.",
  "Your life is a living, breathing work of art in progress.",
  "It's okay to need different things at different seasons of your life.",
  "You are worthy of the effort it takes to heal.",
  "Today, choose the thought that leads somewhere you want to go.",
  "Your potential is not diminished by your past.",
  "It's okay to be proud of the progress others can't see.",
  "You are allowed to have high standards for how you are treated.",
  "Today, be someone who makes others feel seen.",
  "Your capacity for love is one of your most profound gifts.",
  "It's okay to feel good about yourself right now, without caveats.",
  "You are in the process of becoming something beautiful.",
  "Today, give yourself the same compassion you give everyone else.",
  "Your inner voice, at its kindest, knows what you need.",
  "It's okay to feel joy fully — you've earned the right to it.",
  "You are not finished. You are beautifully unfinished.",
  "Today, believe something good about yourself and act like it's true.",
  "Your best self is not a future version. It lives in you right now.",
  "It's okay to be tender-hearted in a world that rewards toughness.",
  "You are allowed to take the time you need.",
  "Today, let yourself be exactly, fully, imperfectly you.",
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
  { text: "Do one thing you've been putting off for 10 minutes", icon: "⏰", category: "growth" },
  { text: "Put your phone in another room for one hour", icon: "📵", category: "mindfulness" },
  { text: "Send someone a voice message instead of a text", icon: "🎙️", category: "connection" },
  { text: "Write down 5 things your body does well for you", icon: "💪", category: "self-love" },
  { text: "Go outside and stand in sunlight for 5 minutes", icon: "☀️", category: "self-care" },
  { text: "Read one chapter of a book", icon: "📖", category: "growth" },
  { text: "Make your bed if you haven't already", icon: "🛏️", category: "environment" },
  { text: "Light a candle or do something that makes your space feel cozy", icon: "🕯️", category: "environment" },
  { text: "Write down three things you want to let go of this week", icon: "🍃", category: "release" },
  { text: "Try a new recipe or food you've never had", icon: "🍜", category: "growth" },
  { text: "Do a random act of kindness for a neighbor", icon: "🏘️", category: "kindness" },
  { text: "Take a photo of something beautiful you see today", icon: "📸", category: "presence" },
  { text: "Write down one fear and then write why you're bigger than it", icon: "🦁", category: "reflection" },
  { text: "Have a caffeine-free afternoon", icon: "🍵", category: "self-care" },
  { text: "Tell someone about a dream you have for your life", icon: "💭", category: "connection" },
  { text: "Put on a playlist that matches the mood you WANT to be in", icon: "🎧", category: "joy" },
  { text: "Reach out to someone you've been meaning to reconnect with", icon: "🤝", category: "connection" },
  { text: "Do a 5-minute meditation or body scan", icon: "🧘", category: "calm" },
  { text: "Write down what 'enough' looks like for you today", icon: "✅", category: "reflection" },
  { text: "Try something you've been scared to start", icon: "🚀", category: "growth" },
  { text: "Go for a drive or walk with no destination", icon: "🗺️", category: "presence" },
  { text: "Spend 10 minutes journaling with no prompt — just stream of consciousness", icon: "📓", category: "reflection" },
  { text: "Stand up and move your body for 2 full minutes right now", icon: "🏃", category: "self-care" },
  { text: "Watch a short documentary about something you know nothing about", icon: "🌍", category: "growth" },
  { text: "Tell three people something specific you appreciate about them", icon: "💛", category: "kindness" },
  { text: "Leave your phone at home for one short errand", icon: "🚶", category: "mindfulness" },
  { text: "Write a list of 10 things that make you uniquely you", icon: "🦄", category: "self-love" },
  { text: "Make plans with a friend for something to look forward to", icon: "📅", category: "joy" },
  { text: "Try box breathing: inhale 4, hold 4, exhale 4, hold 4", icon: "🌬️", category: "calm" },
  { text: "Clean out your email inbox for 10 minutes", icon: "📧", category: "environment" },
  { text: "Watch the sky — clouds, stars, or just blue — for 5 minutes", icon: "☁️", category: "presence" },
  { text: "Do something you loved doing as a child", icon: "🧸", category: "joy" },
  { text: "Write a list of every obstacle you've overcome", icon: "🏔️", category: "reflection" },
  { text: "Compliment yourself out loud, as if talking to a best friend", icon: "🫂", category: "self-love" },
  { text: "Hydrate: drink an extra glass of water every hour today", icon: "💦", category: "self-care" },
  { text: "Start something creative — one page, one sketch, one song verse", icon: "🎭", category: "expression" },
  { text: "Send a care package or care text to someone going through a hard time", icon: "📦", category: "kindness" },
  { text: "Sit outside for 10 minutes without doing anything else", icon: "🌿", category: "mindfulness" },
  { text: "Write a personal mission statement in one sentence", icon: "🎯", category: "reflection" },
  { text: "Do something that scares you just a little bit", icon: "😬", category: "growth" },
  { text: "Tell someone you love them today — unprompted", icon: "❤️", category: "connection" },
  { text: "Sleep 30 minutes earlier than usual tonight", icon: "😴", category: "self-care" },
  { text: "Finish something you started and haven't completed", icon: "✔️", category: "growth" },
  { text: "Bake or make something with your hands", icon: "🍞", category: "expression" },
  { text: "Write a gratitude list of 10 things, big or small", icon: "🙏", category: "gratitude" },
  { text: "Set one clear intention for how you want to feel today", icon: "🌟", category: "mindfulness" },
  { text: "Put away your phone at least 30 minutes before bed tonight", icon: "🌙", category: "self-care" },
  { text: "Visit a place you've never been, even if it's just a new street", icon: "🗺️", category: "presence" },
  { text: "Choose one habit you want to start and take the first tiny step", icon: "🌱", category: "growth" },
  { text: "Give yourself a genuine compliment in the mirror this morning", icon: "✨", category: "self-love" },
  { text: "Create a 'Joy List' — 10 things that never fail to lift your mood", icon: "😊", category: "joy" },
  { text: "Reach out to a mentor, role model, or someone you look up to", icon: "🌟", category: "connection" },
  { text: "Write down the nicest thing anyone has ever said to you", icon: "💬", category: "reflection" },
  { text: "Do a kind thing anonymously", icon: "🎁", category: "kindness" },
  { text: "Notice and name 5 emotions you feel today — just observe, don't judge", icon: "🧠", category: "mindfulness" },
  { text: "Reorganize one drawer or corner of your space", icon: "🗂️", category: "environment" },
  { text: "Share something you made or created with someone who'd appreciate it", icon: "🎨", category: "expression" },
  { text: "Write a letter forgiving someone (you don't have to send it)", icon: "🕊️", category: "release" },
  { text: "Learn one word in a language you don't speak", icon: "🌐", category: "growth" },
  { text: "Make a 'done list' instead of a to-do list — celebrate what you've already accomplished", icon: "🏆", category: "reflection" },
  { text: "Take a bath or long shower as an act of self-care, not just hygiene", icon: "🛁", category: "self-care" },
  { text: "Send a 'thinking of you' message to three people today", icon: "💌", category: "connection" },
  { text: "Set a boundary you've been avoiding — big or small", icon: "🛑", category: "boundaries" },
  { text: "Make eye contact and smile at people you pass today", icon: "👀", category: "kindness" },
  { text: "Go somewhere in nature, even for 10 minutes", icon: "🌳", category: "presence" },
  { text: "Write about the version of yourself you want to be in one year", icon: "🔮", category: "reflection" },
  { text: "Laugh — find a funny video, call a funny friend, watch stand-up", icon: "😂", category: "joy" },
  { text: "Declutter your phone home screen", icon: "📱", category: "environment" },
  { text: "Move your body in a way that feels good, not punishing", icon: "💃", category: "self-care" },
  { text: "Ask someone how they really are — and mean it", icon: "🤗", category: "connection" },
  { text: "Spend 5 minutes visualizing your ideal future in vivid detail", icon: "🌈", category: "reflection" },
  { text: "Say thank you to someone who helps you regularly but rarely gets acknowledged", icon: "🙏", category: "gratitude" },
  { text: "Write down 3 things you want to stop worrying about today", icon: "🌸", category: "release" },
  { text: "Let yourself be bored for 10 minutes — no stimulation", icon: "🪟", category: "mindfulness" },
  { text: "Do something that nourishes your spirit — whatever that means to you", icon: "💫", category: "self-care" },
  { text: "Plan your ideal day — from wake-up to sleep — and make one part of it real today", icon: "🌄", category: "reflection" },
  { text: "Write down what you would tell your 15-year-old self", icon: "📝", category: "reflection" },
  { text: "Start a small collection of things that make you happy", icon: "🫙", category: "joy" },
  { text: "Turn off all notifications for the next two hours", icon: "🔕", category: "mindfulness" },
  { text: "Do a kindness challenge: see how many kind things you can do in one hour", icon: "🌻", category: "kindness" },
  { text: "Write down what you need more of in your life right now", icon: "🌊", category: "reflection" },
  { text: "Do a 10-minute digital detox — close all apps and just be present", icon: "🧘", category: "mindfulness" },
  { text: "Share a meal with someone and be fully present — no phones", icon: "🍽️", category: "connection" },
  { text: "Start a gratitude jar — write one thing on a piece of paper and put it in", icon: "🫙", category: "gratitude" },
  { text: "Notice one thing today that you usually take for granted", icon: "👁️", category: "gratitude" },
  { text: "Write down your top 5 values and see if how you spent today reflects them", icon: "⚖️", category: "reflection" },
  { text: "Send a photo to someone of something that reminded you of them", icon: "📷", category: "connection" },
  { text: "Give yourself 30 minutes of completely unscheduled, screen-free time", icon: "🌿", category: "self-care" },
  { text: "Learn one skill — watch a 5-minute YouTube tutorial on anything", icon: "🎓", category: "growth" },
  { text: "Write down three things you like about your personality today", icon: "💛", category: "self-love" },
  { text: "Create a playlist called 'When I Need a Boost' and add 5 songs", icon: "🎶", category: "joy" },
  { text: "Sit quietly and just listen to the sounds around you for 5 minutes", icon: "👂", category: "presence" },
  { text: "Write down a goal and break it into 3 tiny next steps", icon: "🗺️", category: "growth" },
  { text: "Do something generous without being asked", icon: "💝", category: "kindness" },
  { text: "Spend time with an animal today — pet, watch, or visit one", icon: "🐾", category: "joy" },
  { text: "Try to go the whole day without complaining — replace complaints with observations", icon: "🌼", category: "mindfulness" },
  { text: "Move your body outside — walk, run, stretch, anything", icon: "🌿", category: "self-care" },
  { text: "Read something that challenges you or expands your worldview", icon: "📚", category: "growth" },
  { text: "Write down what you're most afraid of losing and appreciate it today", icon: "💎", category: "gratitude" },
  { text: "Pick one relationship and invest in it intentionally today", icon: "🌱", category: "connection" },
  { text: "Do something you're genuinely looking forward to today", icon: "🎉", category: "joy" },
  { text: "Ask for feedback from someone you trust about something you're working on", icon: "🔍", category: "growth" },
  { text: "Sit in a different spot than usual — change your perspective literally", icon: "🔄", category: "mindfulness" },
  { text: "Write a 'love letter' to your own life — what do you appreciate about it?", icon: "💌", category: "gratitude" },
  { text: "Pick up a hobby you dropped and give it 15 minutes today", icon: "🎯", category: "joy" },
  { text: "Apologize to someone you owe an apology to", icon: "🤝", category: "connection" },
  { text: "Do one thing today that future-you will thank you for", icon: "🌟", category: "growth" },
  { text: "Write down every single win from this week, no matter how small", icon: "🏆", category: "reflection" },
  { text: "Take yourself on a solo date — coffee, a walk, a movie", icon: "☕", category: "self-love" },
  { text: "Let yourself be helped today — say yes when someone offers", icon: "🤗", category: "self-love" },
  { text: "Find one thing to be grateful for in something difficult right now", icon: "🌱", category: "gratitude" },
  { text: "Write down the story of a time you were really proud of yourself", icon: "📖", category: "self-love" },
  { text: "Cook a meal and eat it somewhere other than in front of a screen", icon: "🍳", category: "mindfulness" },
  { text: "Talk to someone older than you and ask them one life question", icon: "🧓", category: "growth" },
  { text: "Make one corner of your home more beautiful or organized", icon: "🏡", category: "environment" },
  { text: "Say something out loud that you've only been thinking", icon: "🗣️", category: "expression" },
  { text: "Take the scenic route somewhere today", icon: "🌸", category: "presence" },
  { text: "Spend 5 minutes doing absolutely nothing and resist the urge to fill it", icon: "🌙", category: "calm" },
  { text: "Write a list of people who have positively changed your life", icon: "💛", category: "gratitude" },
  { text: "Commit to one small healthy habit just for today", icon: "💪", category: "self-care" },
  { text: "Read a poem — just one — and sit with how it makes you feel", icon: "📜", category: "presence" },
  { text: "Write down three things you're choosing to believe about yourself today", icon: "💭", category: "self-love" },
  { text: "Do something with your hands — garden, craft, build, cook", icon: "🌱", category: "expression" },
  { text: "Go to bed 30 minutes earlier and do something calm before sleep", icon: "🌙", category: "self-care" },
  { text: "Write down what your ideal morning looks like and try one part of it tomorrow", icon: "🌄", category: "growth" },
  { text: "Have a conversation today where you ask more than you talk", icon: "👂", category: "connection" },
  { text: "Find and save an inspiring quote that you want to remember", icon: "💬", category: "reflection" },
  { text: "Do a 1-minute cold water face wash — quick reset for the day", icon: "💦", category: "self-care" },
  { text: "Take a nap if your body is asking for one — no guilt", icon: "😴", category: "self-care" },
  { text: "Send a meme or funny thing to someone who could use a laugh", icon: "😂", category: "kindness" },
  { text: "Write about what brings you the most peace", icon: "🕊️", category: "reflection" },
  { text: "Commit to saying one true, kind thing about yourself every time you pass a mirror today", icon: "🪞", category: "self-love" },
  { text: "Share an idea you've been keeping to yourself", icon: "💡", category: "expression" },
  { text: "Do one thing that makes you feel productive and proud", icon: "✅", category: "growth" },
  { text: "Plan something — a trip, a dinner, a project — and write down the first step", icon: "✈️", category: "joy" },
  { text: "Write down three words you want to feel more of in your life", icon: "🌈", category: "reflection" },
  { text: "Make someone feel seen today in a way they won't expect", icon: "💫", category: "kindness" },
  { text: "Put on comfortable clothes and give yourself permission to just be at home today", icon: "🧦", category: "self-care" },
  { text: "Write a thank-you to your past self for a decision that served you well", icon: "🙏", category: "gratitude" },
  { text: "Do 10 minutes of stretching before bed tonight", icon: "🌙", category: "self-care" },
  { text: "Listen to a podcast that teaches you something while doing chores", icon: "🎙️", category: "growth" },
  { text: "Reframe one negative belief about yourself using evidence against it", icon: "🔄", category: "reflection" },
  { text: "Spend 5 minutes writing about what you want your legacy to be", icon: "🌟", category: "reflection" },
  { text: "Let yourself be proud of something you accomplished this month", icon: "🏅", category: "self-love" },
  { text: "Buy or pick flowers for yourself — or someone else", icon: "🌸", category: "joy" },
  { text: "Clean out something you've been avoiding — a message thread, a shelf, a drawer", icon: "🗂️", category: "release" },
  { text: "Make yourself the priority for just one hour today", icon: "👑", category: "self-love" },
  { text: "Read about someone who inspires you — their story, their journey", icon: "📚", category: "growth" },
  { text: "Volunteer your time or energy for a cause you believe in", icon: "🌍", category: "kindness" },
  { text: "Write down the compliments you've received that you brushed off — receive them now", icon: "🌸", category: "self-love" },
  { text: "Watch the first 10 minutes of sunrise or sunset without distraction", icon: "🌅", category: "presence" },
  { text: "Tell someone your honest opinion when they ask for it today", icon: "💬", category: "expression" },
  { text: "Go somewhere quiet and just think — no agenda, no phone", icon: "🌲", category: "mindfulness" },
  { text: "Commit to no negative self-talk for the next 2 hours", icon: "💛", category: "self-love" },
  { text: "Write about a time when everything felt impossible and you made it through anyway", icon: "🦋", category: "reflection" },
  { text: "Ask yourself: what is my body trying to tell me today?", icon: "🧘", category: "mindfulness" },
  { text: "Celebrate a friend's win like it's your own", icon: "🎉", category: "connection" },
  { text: "Be the first to say hello to 5 people today", icon: "👋", category: "kindness" },
  { text: "Write about what your happiest self looks like", icon: "🌟", category: "reflection" },
  { text: "Take a break from the news and social media for the full day", icon: "📵", category: "boundaries" },
  { text: "Do the thing that would make you feel most accomplished today", icon: "🎯", category: "growth" },
  { text: "Write your own affirmation — one that speaks to exactly what you need right now", icon: "✏️", category: "self-love" },
  { text: "Sit with a hard feeling for 5 minutes without trying to fix it", icon: "🫀", category: "mindfulness" },
  { text: "Call a grandparent, parent, or elder and just listen to their stories", icon: "📞", category: "connection" },
  { text: "Try to catch yourself being kind and notice how it feels", icon: "💛", category: "self-love" },
  { text: "Spend 10 minutes with something beautiful — art, music, nature", icon: "🎶", category: "presence" },
  { text: "Write a list of everything that's working in your life right now", icon: "📋", category: "gratitude" },
  { text: "Take yourself somewhere you've never been within 10 minutes of home", icon: "🔍", category: "presence" },
  { text: "Make a decision you've been avoiding — even if it's imperfect", icon: "🎲", category: "growth" },
  { text: "Write what you'd do if you knew you could not fail", icon: "🚀", category: "reflection" },
  { text: "Practice receiving a compliment without deflecting it — just say thank you", icon: "🌸", category: "self-love" },
  { text: "Identify one energy drain in your life and take one step to reduce it", icon: "🔋", category: "boundaries" },
  { text: "Spend 15 minutes on something just for fun, with no other purpose", icon: "🎈", category: "joy" },
  { text: "Go to bed grateful — name 5 things before you close your eyes tonight", icon: "🌙", category: "gratitude" },
  { text: "Write down every person who loves you — make the list longer than you think", icon: "💛", category: "reflection" },
  { text: "Do a 5-minute tidy of your digital life: delete 10 old files or emails", icon: "🗑️", category: "environment" },
  { text: "Put on a song you loved as a teenager and let yourself feel it", icon: "🎵", category: "joy" },
  { text: "Write a note to someone who influenced you — alive or not", icon: "✉️", category: "gratitude" },
  { text: "Identify one small habit that's hurting you and pause it for today", icon: "🛑", category: "boundaries" },
  { text: "Read a poem out loud — to yourself or someone else", icon: "📜", category: "expression" },
  { text: "Make a vision board — even just a quick digital one", icon: "🌟", category: "reflection" },
  { text: "Donate something to someone who needs it more", icon: "🎁", category: "kindness" },
  { text: "Make a list of your top 10 life experiences so far", icon: "📋", category: "reflection" },
  { text: "Take a minute to appreciate your own hands and what they do for you", icon: "🙌", category: "self-love" },
  { text: "Start the day with 10 minutes of quiet before touching your phone", icon: "🌅", category: "mindfulness" },
  { text: "Try a completely new type of food or cuisine today", icon: "🍱", category: "growth" },
  { text: "Find one thing you can laugh at yourself about today", icon: "😂", category: "joy" },
  { text: "Write down one thing you'd like to change and one step to start", icon: "🔄", category: "growth" },
  { text: "Sit somewhere new today — coffee shop, park, library — and just observe", icon: "👁️", category: "presence" },
  { text: "Go a whole hour being fully present with whoever you're with — no phone", icon: "🤝", category: "connection" },
  { text: "Write about a time someone surprised you with their kindness", icon: "💌", category: "gratitude" },
  { text: "Give a hug to someone who needs it (and who would welcome it)", icon: "🤗", category: "connection" },
  { text: "Identify something you're clinging to and practice releasing it — just for today", icon: "🍃", category: "release" },
  { text: "Watch a nature documentary and let it remind you how extraordinary the world is", icon: "🌍", category: "presence" },
  { text: "Think of three ways you are kinder than you were five years ago", icon: "🌸", category: "self-love" },
  { text: "Look for beauty in something mundane today — traffic, dishes, waiting", icon: "🌿", category: "mindfulness" },
  { text: "Choose one small thing that's been annoying you and fix it today", icon: "🔧", category: "environment" },
  { text: "Make time to catch up with someone you've been meaning to see", icon: "☕", category: "connection" },
  { text: "Write down your top 5 sources of energy and do one of them today", icon: "⚡", category: "self-care" },
  { text: "Do a digital sunset: no screens after 9pm tonight", icon: "🌙", category: "self-care" },
  { text: "Say something encouraging to someone who seems to be struggling", icon: "💬", category: "kindness" },
  { text: "Notice your inner critic today and reframe each criticism as a question instead", icon: "🧠", category: "mindfulness" },
  { text: "Make a list of things that have gotten better in your life over the past year", icon: "📈", category: "reflection" },
  { text: "Let go of one plan that isn't working and replace it with something better", icon: "🔄", category: "release" },
  { text: "Pick one person and give them your full, undivided attention today", icon: "💛", category: "connection" },
  { text: "Start a project you've been 'planning to start someday'", icon: "🌱", category: "growth" },
  { text: "Go barefoot outside for a few minutes and feel grounded", icon: "🌿", category: "presence" },
  { text: "Paint, doodle, or color something — no skill required", icon: "🎨", category: "expression" },
  { text: "Write the first paragraph of your memoir", icon: "📖", category: "expression" },
  { text: "Spend 30 minutes on something deeply absorbing — lose yourself in it", icon: "🌊", category: "joy" },
  { text: "Make eye contact with yourself in the mirror and hold it for 30 seconds", icon: "🪞", category: "self-love" },
  { text: "Visit or call someone who might be lonely", icon: "🏠", category: "kindness" },
  { text: "Do a kindness for your future self: prep something, organize something, write something", icon: "⏳", category: "self-care" },
  { text: "End today by writing 3 lines about what made it worth living", icon: "🌙", category: "gratitude" },
  { text: "Help someone without being asked and do it quietly", icon: "🤫", category: "kindness" },
  { text: "Commit to not checking your phone for the first 30 minutes after waking up", icon: "🌄", category: "mindfulness" },
  { text: "Write down everything you've been worrying about — then cross out what you can't control", icon: "✂️", category: "release" },
  { text: "Find one way to make your commute or daily transition more enjoyable", icon: "🎧", category: "joy" },
  { text: "Do one thing that's purely playful — no productivity, no purpose", icon: "🎈", category: "joy" },
  { text: "Take your lunch break outside and eat without doing anything else", icon: "🌞", category: "presence" },
  { text: "Track your mood every two hours today and see what you learn", icon: "📊", category: "mindfulness" },
  { text: "Do something for your community — vote, volunteer, or just show up", icon: "🏘️", category: "kindness" },
  { text: "Write down a fear, then write everything that could go right instead", icon: "🌅", category: "reflection" },
  { text: "Tell a story about your life to someone — share a memory you love", icon: "📖", category: "connection" },
  { text: "Ask someone: 'What's something good that happened this week?' Share yours too.", icon: "💬", category: "connection" },
  { text: "Set a small reward for yourself for completing today's goals", icon: "🎁", category: "joy" },
  { text: "Practice radical acceptance: say 'this is what it is right now' about one hard thing", icon: "🌊", category: "calm" },
  { text: "Pick one area of your life to show up more fully in, starting today", icon: "💪", category: "growth" },
  { text: "Commit to speaking kindly about yourself — even in your head — all day", icon: "🌸", category: "self-love" },
  { text: "Find something broken or incomplete and fix it, even just a little", icon: "🔨", category: "environment" },
  { text: "Share your day honestly with someone you trust", icon: "🤝", category: "connection" },
  { text: "Spend 10 minutes appreciating your own resilience and how hard you've worked", icon: "🏆", category: "self-love" },
  { text: "Try 5 minutes of gratitude journaling in the morning before the day starts", icon: "🌄", category: "gratitude" },
  { text: "Write about what a 'perfect ordinary day' would look like for you", icon: "🌿", category: "reflection" },
  { text: "Identify someone who needs encouragement and be the one to give it", icon: "💌", category: "kindness" },
  { text: "Do something today that will matter a year from now", icon: "📅", category: "growth" },
  { text: "Take 5 minutes to breathe, stretch, and reset between tasks", icon: "🌬️", category: "self-care" },
  { text: "Find one thing you can let go of today — an obligation, a resentment, a plan", icon: "🍃", category: "release" },
  { text: "Write a list of 10 things you've never done but want to", icon: "✈️", category: "growth" },
  { text: "Spend 20 minutes completely offline — no screens, no input", icon: "🌿", category: "mindfulness" },
  { text: "Do a 10-minute morning stretch before you pick up your phone", icon: "🧘", category: "self-care" },
  { text: "Write down every excuse holding you back from something — then challenge one", icon: "🔍", category: "growth" },
  { text: "Reach out to someone you've been thinking about but haven't contacted", icon: "💬", category: "connection" },
  { text: "Spend 15 minutes in your favorite kind of nature", icon: "🌊", category: "presence" },
  { text: "List 5 songs that make you feel powerful — make them your soundtrack today", icon: "🎶", category: "joy" },
  { text: "Choose kindness in one situation where you'd normally be impatient", icon: "🕊️", category: "kindness" },
  { text: "Write about who you want to be remembered as", icon: "📝", category: "reflection" },
  { text: "Identify one small habit that's helping you and do it intentionally today", icon: "✅", category: "growth" },
  { text: "Do something to make your sleep environment better tonight", icon: "🌙", category: "self-care" },
  { text: "Tell someone a true, specific thing you love about them", icon: "❤️", category: "connection" },
  { text: "Write down three things you want to start doing more of", icon: "🌱", category: "reflection" },
  { text: "Notice and appreciate something you usually walk past without seeing", icon: "👁️", category: "presence" },
  { text: "Do something with your full attention — no multitasking", icon: "🎯", category: "mindfulness" },
  { text: "Check in on your own mental health: what do you actually need today?", icon: "🧠", category: "self-care" },
  { text: "Create something just to create it — not to share or show", icon: "🎨", category: "expression" },
  { text: "Give someone the gift of your complete attention for 10 minutes", icon: "👂", category: "connection" },
  { text: "Write a list of questions you want answered before you die", icon: "🔮", category: "reflection" },
  { text: "Acknowledge out loud one thing you did today that was hard", icon: "💪", category: "self-love" },
  { text: "Open the windows and let fresh air into your space", icon: "🌬️", category: "environment" },
  { text: "Commit to one hour of deep focus work without distraction", icon: "🧩", category: "growth" },
  { text: "Make a list of every person who has helped you get to where you are", icon: "🌟", category: "gratitude" },
  { text: "Try meditation for the first time or return to it for 5 minutes", icon: "🧘", category: "calm" },
  { text: "Write down what 'home' means to you", icon: "🏡", category: "reflection" },
  { text: "Have a screen-free dinner tonight", icon: "🍽️", category: "mindfulness" },
  { text: "Create something with words — a poem, a list, a paragraph of feelings", icon: "✍️", category: "expression" },
  { text: "Identify one thing in your life you've outgrown and release it", icon: "🍂", category: "release" },
  { text: "Choose to see the best in someone who challenges you today", icon: "💛", category: "kindness" },
  { text: "Take yourself on a solo adventure — even just a walk somewhere unfamiliar", icon: "🗺️", category: "self-love" },
  { text: "Write a list of what you've survived and let it remind you of your strength", icon: "🦋", category: "self-love" },
  { text: "Practice saying 'I don't know' without feeling the need to fill the silence", icon: "🤫", category: "mindfulness" },
  { text: "Plan one thing to look forward to this week, even something small", icon: "🎉", category: "joy" },
  { text: "Let today's to-do list have a joy item at the top", icon: "🌈", category: "joy" },
  { text: "Read something that challenges your current worldview", icon: "📚", category: "growth" },
  { text: "Make one part of your routine more intentional and less automatic", icon: "🔄", category: "mindfulness" },
  { text: "Say I love you first today to someone who needs to hear it", icon: "💌", category: "connection" },
  { text: "Spend time with something that requires your hands — repair, create, tend", icon: "🌿", category: "expression" },
  { text: "Do something brave — small or large — that past-you would be afraid of", icon: "🦁", category: "growth" },
  { text: "Eat breakfast slowly, without your phone, and taste every bite", icon: "🥣", category: "mindfulness" },
  { text: "Take 3 minutes to recognize everything your body did for you today", icon: "🙏", category: "self-love" },
  { text: "Pick one word as your theme for the rest of the week", icon: "🌟", category: "reflection" },
  { text: "Do a 2-minute visualization: imagine your best day going perfectly", icon: "✨", category: "calm" },
  { text: "Find out what someone in your life actually needs right now — and try to provide it", icon: "🤗", category: "kindness" },
  { text: "Write a thank-you to something inanimate that has served you well", icon: "🛋️", category: "gratitude" },
  { text: "Take a break outside at a time you'd normally push through", icon: "🌤️", category: "self-care" },
  { text: "Write down your proudest moment from each of the last five years", icon: "📅", category: "reflection" },
  { text: "Let yourself feel genuinely excited about something coming up", icon: "🎊", category: "joy" },
  { text: "End today by writing one thing that went right — just one", icon: "🌟", category: "gratitude" },
  { text: "Try something you're not good at yet and stay gentle with yourself", icon: "🌱", category: "growth" },
  { text: "Spend 10 minutes writing freely about what's on your mind — no filter", icon: "📓", category: "expression" },
  { text: "Notice something in your immediate environment that is quietly beautiful", icon: "🌸", category: "presence" },
  { text: "Do a random act of kindness that no one will see or know about", icon: "💛", category: "kindness" },
  { text: "Set one clear, realistic intention for the next 7 days", icon: "🗓️", category: "growth" },
  { text: "Spend 5 minutes writing about a future version of your life you're excited about", icon: "🔮", category: "reflection" },
  { text: "Let yourself be proud of simply existing today", icon: "🌟", category: "self-love" },
  { text: "Make time to do nothing — genuinely, purposefully nothing — for 10 minutes", icon: "🌿", category: "calm" },
  { text: "Go somewhere peaceful and bring nothing — just yourself", icon: "🌾", category: "presence" },
  { text: "Tell your story to someone who hasn't heard it", icon: "📖", category: "connection" },
  { text: "Set a gentle alarm for bedtime and honor it", icon: "🛏️", category: "self-care" },
  { text: "Write down everything you want to feel more of and choose one to pursue today", icon: "💫", category: "reflection" },
  { text: "Notice how often you say sorry unnecessarily — and try to stop once today", icon: "🌸", category: "self-love" },
  { text: "Write a manifesto for the life you want to live — just one paragraph", icon: "✨", category: "reflection" },
  { text: "Choose to believe in someone today who might not believe in themselves", icon: "💛", category: "kindness" },
  { text: "Spend 5 minutes in your favorite spot doing absolutely nothing", icon: "🌙", category: "calm" },
  { text: "Make a plan to make one area of your life more joyful next month", icon: "📅", category: "growth" },
  { text: "Write about something that happened today that you don't want to forget", icon: "📓", category: "presence" },
  { text: "Commit to one act of discipline today that your future self will thank you for", icon: "⏰", category: "growth" },
  { text: "Write down everything you are, beyond your job or role or title", icon: "🌟", category: "self-love" },
  { text: "Have a conversation today where you share something real and vulnerable", icon: "🤝", category: "connection" },
  { text: "Leave something better than you found it today", icon: "🌿", category: "kindness" },
  { text: "Celebrate yourself for something specific — out loud, at least once", icon: "🎉", category: "self-love" },
  { text: "Find one thing in your current environment to improve or beautify", icon: "🌸", category: "environment" },
  { text: "Spend one hour doing something you've been putting off", icon: "⏳", category: "growth" },
  { text: "Let go of one grudge — even just for today — and feel what that opens up", icon: "🕊️", category: "release" },
  { text: "Notice three moments today where you felt grateful — in real time", icon: "✨", category: "gratitude" },
  { text: "Make a list of everything that's going well, no matter how small", icon: "🌱", category: "gratitude" },
  { text: "Ask yourself honestly: am I taking care of myself right now? Respond kindly.", icon: "💛", category: "self-care" },
  { text: "Write a short letter to yourself from someone who loves you most", icon: "💌", category: "self-love" },
  { text: "Do something generous that costs only your time", icon: "⏱️", category: "kindness" },
  { text: "Revisit a place that holds good memories", icon: "🗺️", category: "presence" },
  { text: "Write about what you're still becoming — and feel good about it", icon: "🌅", category: "reflection" },
  { text: "Identify the one thing you need most today and give it to yourself", icon: "🎁", category: "self-care" },
  { text: "Choose one thought pattern to interrupt today with something kinder", icon: "🔄", category: "mindfulness" },
  { text: "Make something beautiful with what you already have", icon: "🌻", category: "expression" },
  { text: "Sit with someone you love and just be — no agenda, no phones", icon: "🤗", category: "connection" },
  { text: "Write the three most important values you want to live by and evaluate your day against them", icon: "⚖️", category: "reflection" },
  { text: "Be the calmest person in the room today", icon: "🌊", category: "calm" },
  { text: "List all the obstacles you've overcome — read it like a victory list", icon: "🏆", category: "self-love" },
  { text: "Let yourself be carried by the moment — don't plan, just experience", icon: "🌈", category: "presence" },
  { text: "Choose joy as your default response whenever possible today", icon: "😊", category: "joy" },
  { text: "Share something that made you happy this week with someone who'd appreciate it", icon: "💬", category: "connection" },
  { text: "Revisit a goal you abandoned and ask honestly: is it still mine?", icon: "🔍", category: "reflection" },
  { text: "Do one thing to invest in a relationship that really matters to you", icon: "💛", category: "connection" },
  { text: "Create space in your schedule for something that has no purpose except enjoyment", icon: "🎈", category: "joy" },
  { text: "Write what you hope someone will say about you at the end of your life", icon: "📖", category: "reflection" },
  { text: "Honor your own wisdom today — you know more than you think", icon: "🦉", category: "self-love" },
  { text: "Pick one moment today and experience it with all five senses", icon: "✨", category: "presence" },
  { text: "Do one thing that makes your home feel more like a sanctuary", icon: "🏡", category: "environment" },
  { text: "Make a decision based on love rather than fear today", icon: "❤️", category: "growth" },
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
  "Who in your life makes you laugh the hardest?",
  "What's something your body does for you that you're grateful for?",
  "What's a piece of technology that genuinely improves your life?",
  "What's a book, show, or film that changed how you see the world?",
  "Who do you feel most yourself around?",
  "What's a small luxury you enjoy regularly?",
  "What's something you learned this week?",
  "What's a friendship you're grateful to have?",
  "What's something that exists in the world that brings you joy, even if it's not yours?",
  "What's a quality in yourself that you're glad you developed?",
  "What's one experience you're glad you said yes to?",
  "What's something about your upbringing that made you who you are?",
  "What song always lifts your mood?",
  "What's something you have today that you once really wished for?",
  "What's a random act of kindness someone showed you that you still think about?",
  "What part of your life right now would your past self be amazed by?",
  "What's a smell that brings you comfort?",
  "What's something you're grateful exists in nature?",
  "Who is someone who always shows up for you, no matter what?",
  "What's something you use every day that makes your life easier?",
  "What's a tradition or ritual that brings you happiness?",
  "What's something kind you did recently that made you feel good?",
  "What's a moment this week where you felt truly present?",
  "What's a hard thing you got through that made you stronger?",
  "What's something in your neighborhood or community you appreciate?",
  "What's a piece of advice you received that changed your life?",
  "What's a talent someone close to you has that you admire?",
  "What's an ordinary thing that would be extraordinary if you really thought about it?",
  "What's something you're glad you changed your mind about?",
  "What's a moment when a stranger was kind to you?",
  "What's something you're really good at that you forget to appreciate?",
  "What made you feel safe or protected recently?",
  "What's a piece of art (music, painting, words) that moved you?",
  "What's something in your city or town you're glad exists?",
  "Who in your life always tells you the truth with kindness?",
  "What's something you did this month that you're proud of?",
  "What's a food or meal that feels like home to you?",
  "What's something your mind can do that still amazes you?",
  "What's a relationship that has grown and deepened over time?",
  "What's a small success from today that deserves more credit?",
  "What's something about the season you're in right now that you appreciate?",
  "What's one thing you're looking forward to?",
  "What's something funny that happened recently that still makes you smile?",
  "What's a moment recently when you felt truly loved?",
  "What's a boundary you set that has made your life better?",
  "What's something about your life today that would have seemed like a dream years ago?",
  "Who do you think about with warmth when they come to mind?",
  "What's a material thing you own that genuinely improves your life?",
  "What's something you've been learning that excites you?",
  "What's something small in your day that gives it structure or comfort?",
  "What's a risk you took that paid off?",
  "What's something you've overcome that you rarely give yourself credit for?",
  "What's one way you've grown in the last year?",
  "What's something about where you live that you love?",
  "What's an unexpected friendship or connection you're grateful for?",
  "What's a tool, app, or habit that genuinely helps you?",
  "What's a moment of unexpected beauty you witnessed recently?",
  "What's something that costs nothing but brings you real pleasure?",
  "What's something your closest friend brings to your life?",
  "What's a moment where things turned out better than you expected?",
  "What's something about your health or body you're grateful for today?",
  "What's something you created that you're proud of?",
  "What's something from your past that you now see as a gift?",
  "What's a piece of wisdom you've come to understand in your own way?",
  "What's a person in your life who consistently makes you feel good about yourself?",
  "What's something in your daily life that you often rush past but could slow down to enjoy?",
  "What's a kindness you've extended to yourself recently?",
  "What's something that gets better the more you practice it?",
  "What's an animal — wild or not — that you feel grateful exists?",
  "What's something about your past that equipped you for the present?",
  "What's a hope or dream you have that still excites you?",
  "What's a conversation that stayed with you in a good way?",
  "What's something simple that happened today that you don't want to forget?",
  "What's a place you've visited that changed you?",
  "What's something about your personality that has helped you through hard times?",
  "What's a habit you've built that you're glad you started?",
  "What's a piece of technology you couldn't imagine living without?",
  "What's something your family or chosen family gives you?",
  "What's a moment when you felt completely at home somewhere?",
  "What's something you experienced recently for the first time that surprised you?",
  "What's a lesson life has taught you the hard way that you're now grateful for?",
  "What's something small that always manages to cheer you up?",
  "What's a creative outlet that lets you express something you can't otherwise say?",
  "What's something about the people around you that you admire?",
  "What's a smell, texture, or sensation that you deeply enjoy?",
  "What's a moment of stillness you had recently that you wish you could revisit?",
  "What's something about this exact time in your life that's precious?",
  "What's a part of your story you've come to feel grateful for, even though it was painful?",
  "What's something you said yes to that changed things for the better?",
  "What's one small good thing that happened today?",
  "What's a dream you have right now that makes you excited to get up in the morning?",
  "What's something about the world that fills you with wonder?",
  "What's one way the world is better because you're in it?",
  "What's a moment this week where you surprised yourself?",
  "What's something you're glad someone else introduced you to?",
  "What's a quality in yourself that you're working on and already see improving?",
  "What's something quiet and simple that you genuinely love about your life?",
  "What's a word of encouragement you received that stuck with you?",
  "What's something you experienced today that you want to hold onto?",
  "What's something that has gotten easier over time?",
  "What's a memory with someone you love that still makes you smile?",
  "What's a part of your life that's better than it was one year ago?",
  "What's something about yourself that you've learned to love?",
  "What's something you have right now that many people don't, but you rarely think about?",
  "What's a teacher, coach, or mentor who shaped who you are?",
  "What's a piece of beauty you could find in today, even in something ordinary?",
  "What's something you've built — a relationship, a skill, a habit — that you're proud of?",
  "What's one truth about yourself that you're finally starting to believe?",
  "What's something you'd miss deeply if it disappeared tomorrow?",
  "What's something that happened today that reminded you life is good?",
  "What's a hope you have for yourself that feels closer than it used to?",
  "What's a small kindness that made a big difference to you?",
  "What's something about being alive right now that you find extraordinary?",
  "What's a resource — internal or external — you have that you forget to acknowledge?",
  "What's a friendship that feels effortless and easy?",
  "What's something that happened last week that you haven't fully appreciated yet?",
  "What's one thing that you have worked hard for and can now enjoy?",
  "What's something in your life right now that deserves more gratitude than you give it?",
  "What's an emotion you felt today that, even if hard, reminded you that you're alive?",
  "What's something you get to do today that isn't a given for everyone?",
  "What's the kindest thing you've done for yourself this week?",
  "What's an unexpected moment of joy you've had recently?",
  "What's something you're learning about yourself right now that you're grateful for?",
  "What's a simple physical pleasure you experienced today — warmth, taste, rest?",
  "What's one small thing in your environment right now that you're grateful exists?",
  "What's something you've received from life that you didn't earn or expect?",
  "What's a problem from your past that you're glad is solved?",
  "What's a way you've helped someone recently — big or small?",
  "What's something about the future you're genuinely excited about?",
  "What's a quality in a loved one that you deeply admire?",
  "What's one thing about this moment, right now, that you can be grateful for?",
  "What's a recent failure that taught you something invaluable?",
  "What's something that exists in your life because you worked for it?",
  "What's something you said or did recently that felt true to who you are?",
  "What's a luxury in your daily life that has nothing to do with money?",
  "What's a way your life has surprised you — in a good way?",
  "What's the most beautiful thing you own?",
  "What's something you love about the time of year you're in right now?",
  "What's a way you take care of yourself that you don't give yourself enough credit for?",
  "What's a person who has loved you unconditionally?",
  "What's something in your current life that makes hard days easier?",
  "What's a place you've visited that you still think about?",
  "What's a moment of unexpected connection with a stranger you remember?",
  "What's something about your morning routine you genuinely appreciate?",
  "What's a memory from childhood that still makes you smile?",
  "What's a recent moment of quiet that you savored?",
  "What's something about being exactly your age that you appreciate?",
  "What's a quality in yourself that others have told you they value?",
  "What's a meal you've shared with someone that you still think about?",
  "What's a piece of music that feels like it was written for you?",
  "What's a simple act of care someone showed you recently?",
  "What's something you can do today that you couldn't do five years ago?",
  "What's something about your current chapter of life that's actually pretty great?",
  "What's a challenge you've faced that ended up opening a door?",
  "What's a promise to yourself that you've kept?",
  "What's an experience that shaped your values in a way you're grateful for?",
  "What's something you've been given — emotionally, materially — that changed things?",
  "What's a word that someone said to you once that still lives in you?",
  "What's a tradition in your life that brings you warmth?",
  "What's a way you've been supported without asking?",
  "What's a risk you took that changed your life in a positive way?",
  "What's one way in which your life today exceeds what you hoped for?",
  "What's something beautiful that happened on an ordinary day recently?",
  "What's a small, recurring joy in your week?",
  "What's something you've gotten better at that once seemed impossible?",
  "What's a gift someone gave you — tangible or not — that meant more than they knew?",
  "What's a way your life has surprised you this year?",
  "What's something you've read or watched that stayed with you?",
  "What's a way someone trusted you that you take pride in?",
  "What's a feeling you've felt recently that you wouldn't trade?",
  "What's a quiet moment you had recently that felt like enough?",
  "What's an aspect of your personality that you've come to appreciate?",
  "What's a recent experience that reminded you of what really matters?",
  "What's an opportunity you had that changed your path?",
  "What's a moment you laughed so hard it became a memory?",
  "What's something that exists in your life today that you once actively worked for?",
  "What's one lesson you're grateful life taught you — even the hard way?",
  "What's a way you've cared for someone else that you're proud of?",
  "What's something in your daily life that brings you steady, quiet comfort?",
  "What's a quality in yourself that you've worked hard to develop?",
  "What's something you've forgiven yourself for that freed you?",
  "What's a small pleasure you enjoy that you'd miss if it were gone?",
  "What's a goal you set and actually achieved?",
  "What's something about the current season of your life that's worth appreciating?",
  "What's a moment this week where you felt proud of yourself?",
  "What's something your younger self would be amazed to know about your life today?",
  "What's something you've built — a skill, a habit, a relationship — that took real effort?",
  "What's an unexpected moment of grace you've experienced?",
  "What's a way your life has gotten simpler or clearer over time?",
  "What's something small you own that brings you genuine happiness?",
  "What's a relationship that has helped you become more yourself?",
  "What's a way that a hard time in your life ultimately served you?",
  "What's something about your mind or heart that you appreciate today?",
  "What's a talent you have that comes naturally and that you sometimes forget to value?",
  "What's something that went right today, even if it was small?",
  "What's something you're grateful for that most people wouldn't think to mention?",
  "What's an experience of beauty — art, nature, kindness — that moved you recently?",
  "What's one true thing about your life right now that's worth celebrating?",
  "What's something about the people you've chosen to be close to that you treasure?",
  "What's something in your home that tells a story of your life?",
  "What's a moment of courage you had recently that you haven't given yourself credit for?",
  "What's something you've been given that you could never repay — and don't have to?",
  "What's a way your life is richer than it looks from the outside?",
  "What's something you've experienced that most people never get to?",
  "What's a challenge right now that's also, in some way, a gift?",
  "What's a daily ritual that makes you feel anchored?",
  "What's something about who you've become that you find genuinely good?",
  "What's something you were wrong about that you're glad you changed your mind on?",
  "What's a form of beauty you experience so often you might take it for granted?",
  "What's something that makes you feel most like yourself?",
  "What's one relationship that has grown deeper over time?",
  "What's something you said or did this year that reflected your best self?",
  "What's an area of your life that's quiet and steady in a good way?",
  "What's a part of your daily environment that you'd miss if it were gone?",
  "What's something in your past that prepared you for something in your present?",
  "What's one reason why today is worth being awake for?",
  "What's a way someone made life easier for you recently?",
  "What's something you've earned that you sometimes forget to take pride in?",
  "What's a connection you have — friend, family, mentor — that feels irreplaceable?",
  "What's something about the world right now that gives you hope?",
  "What's a way you've grown that you'd want to thank yourself for?",
  "What's something about your life that, on your best days, makes you feel lucky?",
  "What's a memory from this year that you want to keep forever?",
  "What's something you would tell someone younger about what really matters?",
  "What's something about your life story that you've come to see as a strength?",
  "What's a way the world has been kinder to you than you expected?",
  "What's one small thing you have right now that you once desperately wanted?",
  "What's something that makes your corner of the world a little better?",
  "What's a way that life has said yes to you lately?",
  "What's something you're grateful to understand now that you didn't before?",
  "What's one thing about your life that would make your heart full if you paused to feel it?",
  "What's a way your life has more color than it did a year ago?",
  "What's a simple daily thing that you'd deeply miss if it disappeared?",
  "What's something that made you feel safe recently?",
  "What's a way someone showed up for you that meant more than they knew?",
  "What's something beautiful about the stage of life you're in right now?",
  "What's a lesson from failure that you now treasure?",
  "What's a way the universe has been kind to you recently?",
  "What's a moment this week that you want to lock in your memory?",
  "What's a quiet joy that fills your everyday life that you rarely speak about?",
  "What's something about today's world that you find remarkable?",
  "What's one place in your life where things are steadily improving?",
  "What's a way you've been surprised by your own strength?",
  "What's something that brings you peace that you've built for yourself?",
  "What's a way that something hard in your past shaped something good in your present?",
  "What's something you've learned to appreciate about yourself that took a long time?",
  "What's a relationship that has helped you be more yourself?",
  "What's a conversation that changed how you see something?",
  "What's something about your own mind that you're genuinely grateful for?",
  "What's a way your daily life is actually quite beautiful when you slow down?",
  "What's a form of support you have that you may underestimate?",
  "What's something you do well that others have benefitted from?",
  "What's an ordinary object in your life that secretly makes everything better?",
  "What's a decision you're glad you made, even though it was scary?",
  "What's a part of your personality that has served you really well in life?",
  "What's a way your body has carried you through something hard?",
  "What's a skill you use so often you forget you had to learn it?",
  "What's a moment of unexpected joy you've had in the last week?",
  "What's a person in your life who consistently brings out your best?",
  "What's something that exists today that you're glad was invented?",
  "What's a friendship that has grown stronger through difficulty?",
  "What's a way your perspective has shifted for the better?",
  "What's something about your current life that took real work to build?",
  "What's an unexpected way something painful ended up helping you?",
  "What's a habit or practice that has genuinely improved your life?",
  "What's something about your history that you can see as an asset now?",
  "What's one way in which you have more than enough right now?",
  "What's a challenge you're currently in that is also making you stronger?",
  "What's a way your life reflects something you truly value?",
  "What's a small, recurring act of love you receive regularly?",
  "What's something you know now that you wish you could tell your past self — with gratitude?",
  "What's a form of beauty you experience so often you forget to notice?",
  "What's a way your life is more aligned with who you are than it used to be?",
  "What's a resource you have — time, space, people, skills — that you undervalue?",
  "What's a memory that reminds you what you're fighting for?",
  "What's something you're proud of that no one applauded you for?",
  "What's one thing about your life that would deeply impress your ten-year-old self?",
  "What's a way the people around you have helped shape who you are?",
  "What's something you can experience today that many people around the world cannot?",
  "What's a way you've grown this year that you don't talk about but should?",
  "What's a quiet source of joy that has been consistent in your life?",
  "What's something you created, built, or contributed that you're genuinely proud of?",
  "What's an act of self-care you gave yourself recently that made a real difference?",
  "What's something about your life that you've stopped seeing clearly because you're so close to it?",
  "What's a way in which things have worked out better than you feared they would?",
  "What's a way someone in your life loves you in a language you needed?",
  "What's a part of your day that is actually, quietly, really good?",
  "What's something about your life that fills you with quiet pride?",
  "What's a way your past self was brave in a way that directly benefits you today?",
  "What's a form of joy that is entirely, specifically yours?",
  "What's something you've been through that you couldn't have survived without others?",
  "What's an ordinary experience — a commute, a meal, a routine — that actually holds something good?",
  "What's a way you've handled something this year that you're proud of?",
  "What's something small you have today that you once worked really hard for?",
  "What's a way the world has been more generous to you than you expected?",
  "What's something about who you are that makes other people's lives better?",
  "What's a way in which your life is quietly, steadily good?",
  "What's a moment from this year you'd want to live again?",
  "What's something that, when you stop and really think about it, is extraordinary?",
  "What's a part of your story you've made peace with?",
  "What's something you've given that came back to you in unexpected ways?",
  "What's an experience of connection — with a person, a place, a moment — that still carries warmth?",
  "What's something you have right now that you once thought was impossible?",
  "What's a part of being alive that, on your best days, fills you with wonder?",
  "What's something about your daily life that would have felt like a miracle to you five years ago?",
  "What's a way you've shown love this week that you haven't given yourself credit for?",
  "What's something you've received from life that you could never have planned or earned?",
  "What's a simple thing you're going to do today that you get to do — not have to do?",
  "What's something good about you that you forget when things are hard?",
  "What's something about the people you love that makes your life immeasurably richer?",
  "What's a door that closed for you that led to something better?",
  "What's a part of your personality that you've finally stopped apologizing for?",
  "What's something in your present that your future self will look back on with gratitude?",
  "What's a moment of joy you've been lucky enough to have more than once?",
  "What's something about your life right now that, if it were gone, you'd deeply miss?",
  "What's a way you've been kind to someone recently that you didn't need to be?",
  "What's one thing you're grateful for that you've never told anyone?",
  "What's a way in which something that seemed bad at the time turned into something good?",
  "What's something you have access to today that most humans throughout history never did?",
  "What's a small detail about your daily life that, if you really paid attention, is beautiful?",
  "What's something about yourself that you've quietly come to love?",
  "What's a way someone has recently made you feel less alone?",
  "What's something you take for granted that, on your best days, fills you with awe?",
  "What's a memory that you carry like a gift?",
  "What's something in your life right now that is working — steadily, reliably, well?",
  "What's one true, good thing about today?",
  "What's something you are that goes beyond what you do?",
  "What's a feeling you felt today that reminded you you're alive?",
  "What's something about the person you're becoming that makes you hopeful?",
  "What's one thing about this moment that you wouldn't trade?",
  "What's a way in which your life has surprised you with its goodness?",
  "What's something small that happened today that, looking back, you'll be glad happened?",
  "What's a way you've already come so far that you forget to acknowledge?",
  "What's something about your life that you'd tell someone else is worth envying?",
  "What's one thing you know for sure that brings you back to yourself when you're lost?",
  "What's the most beautiful ordinary thing in your life right now?",
  "What's one piece of evidence that things really do get better?",
  "What's a way your life is already more than enough?",
  "What's something good happening in your life right now that began as something hard?",
  "What's one small thing today that made the world feel a little kinder?",
  "What's something you've been given that you'll carry with you for the rest of your life?",
  "What's something about today — right now — that is genuinely, quietly, good?",
];


const QUOTES = [
  { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving them.", author: "Zig Ziglar" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "I can't change the direction of the wind, but I can adjust my sails.", author: "Jimmy Dean" },
  { text: "Darkness cannot drive out darkness; only light can do that.", author: "Martin Luther King Jr." },
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "Real generosity toward the future lies in giving all to the present.", author: "Albert Camus" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "Out of difficulties grow miracles.", author: "Jean de la Bruyère" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "We must be willing to let go of the life we planned to have the life that is waiting for us.", author: "Joseph Campbell" },
  { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
  { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou" },
  { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Nothing is impossible; the word itself says 'I'm possible.'", author: "Audrey Hepburn" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "You can't go back and change the beginning, but you can start where you are and change the ending.", author: "C.S. Lewis" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Life is what we make it, always has been, always will be.", author: "Grandma Moses" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "Believe in yourself and all that you are.", author: "Christian D. Larson" },
  { text: "You are the sum total of everything you've ever seen, heard, eaten, smelled, been told, forgot.", author: "Maya Angelou" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "Well-behaved women seldom make history.", author: "Laurel Thatcher Ulrich" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "I have learned over the years that when one's mind is made up, this diminishes fear.", author: "Rosa Parks" },
  { text: "It's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Tell me, what is it you plan to do with your one wild and precious life?", author: "Mary Oliver" },
  { text: "When one door of happiness closes, another opens.", author: "Helen Keller" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "In the end, it's not the years in your life that count, it's the life in your years.", author: "Abraham Lincoln" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas Edison" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" },
  { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Money and success don't change people; they merely amplify what is already there.", author: "Will Smith" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca" },
  { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
  { text: "The whole secret of a successful life is to find out what is one's destiny to do, and then do it.", author: "Henry Ford" },
  { text: "If you're not stubborn, you'll give up on experiments too soon.", author: "Jeff Bezos" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Two roads diverged in a wood, and I took the one less traveled by.", author: "Robert Frost" },
  { text: "I attribute my success to this: I never gave or took any excuse.", author: "Florence Nightingale" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "I've missed more than 9,000 shots in my career. That's why I succeed.", author: "Michael Jordan" },
  { text: "The most difficult thing is the decision to act, the rest is merely tenacity.", author: "Amelia Earhart" },
  { text: "Every strike brings me closer to the next home run.", author: "Babe Ruth" },
  { text: "Definiteness of purpose is the starting point of all achievement.", author: "W. Clement Stone" },
  { text: "Life isn't about getting and having, it's about giving and being.", author: "Kevin Kruse" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" },
  { text: "If you want to make your dreams come true, the first thing you have to do is wake up.", author: "J.M. Power" },
  { text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Eighty percent of success is showing up.", author: "Woody Allen" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { text: "Every child is an artist. The problem is how to remain an artist once he grows up.", author: "Pablo Picasso" },
  { text: "You can never cross the ocean until you have the courage to lose sight of the shore.", author: "Christopher Columbus" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "Whatever the mind of man can conceive and believe, it can achieve.", author: "Napoleon Hill" },
  { text: "First, have a definite, clear practical ideal; a goal, an objective.", author: "Aristotle" },
  { text: "Life is not about finding yourself. Life is about creating yourself.", author: "Lolly Daskal" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "People often say that motivation doesn't last. Well, neither does bathing — that's why we recommend it daily.", author: "Zig Ziglar" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
  { text: "If you hear a voice within you say 'you cannot paint,' then by all means paint and that voice will be silenced.", author: "Vincent Van Gogh" },
  { text: "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.", author: "Aristotle" },
  { text: "Ask and it will be given to you; search, and you will find; knock and the door will be opened for you.", author: "Jesus" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { text: "We become what we think about.", author: "Earl Nightingale" },
  { text: "Twenty years from now you will be more disappointed by the things that you didn't do.", author: "Mark Twain" },
  { text: "What you do speaks so loudly that I cannot hear what you say.", author: "Ralph Waldo Emerson" },
  { text: "Winning isn't everything, but wanting to win is.", author: "Vince Lombardi" },
  { text: "You become what you believe.", author: "Oprah Winfrey" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "The day is what you make it. So why not make it a great one?", author: "Steve Schulte" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "When everything seems to be going against you, remember that the airplane takes off against the wind.", author: "Henry Ford" },
  { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of joy in work is contained in one word — excellence.", author: "Pearl Buck" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "You learn more from failure than from success. Don't let it stop you.", author: "Unknown" },
  { text: "If you are working on something that you really care about, you don't have to be pushed.", author: "Steve Jobs" },
  { text: "Experience is a hard teacher because she gives the test first, the lesson afterward.", author: "Vernon Sanders Law" },
  { text: "To know how much there is to know is the beginning of learning to live.", author: "Dorothy West" },
  { text: "Goal setting is the secret to a compelling future.", author: "Tony Robbins" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { text: "In every day, there are 1,440 minutes. That means we have 1,440 daily opportunities to make a positive impact.", author: "Les Brown" },
  { text: "If you genuinely want something, don't wait for it — teach yourself to be impatient.", author: "Gurbaksh Chahal" },
  { text: "Don't wait. The time will never be just right.", author: "Napoleon Hill" },
  { text: "Inspiration does exist, but it must find you working.", author: "Pablo Picasso" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
  { text: "If you want to conquer the anxiety of life, live in the moment, live in the breath.", author: "Amit Ray" },
  { text: "Do the difficult things while they are easy and do the great things while they are small.", author: "Lao Tzu" },
  { text: "The secret to happiness is not in doing what one likes but in liking what one does.", author: "James M. Barrie" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "Only I can change my life. No one can do it for me.", author: "Carol Burnett" },
  { text: "Challenges are what make life interesting. Overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
  { text: "A winner is just a loser who tried one more time.", author: "George M. Moore Jr." },
  { text: "If you can dream it, you can achieve it.", author: "Zig Ziglar" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "You've got to get up every morning with determination if you're going to go to bed with satisfaction.", author: "George Lorimer" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine" },
  { text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank" },
  { text: "When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left.", author: "Erma Bombeck" },
  { text: "Few things can help an individual more than to place responsibility on him, and to let him know that you trust him.", author: "Booker T. Washington" },
  { text: "Certain things catch your eye, but pursue only those that capture the heart.", author: "Ancient Indian Proverb" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Everything you've ever wanted is sitting on the other side of fear.", author: "George Addair" },
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare" },
  { text: "Meaning is not something you stumble across, like the answer to a riddle or the prize in a treasure hunt.", author: "John Gardner" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do, keep moving.", author: "Martin Luther King Jr." },
  { text: "We must believe that we are gifted for something, and that this thing, at whatever cost, must be attained.", author: "Marie Curie" },
  { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
  { text: "Perfection is not attainable. But if we chase perfection, we can catch excellence.", author: "Vince Lombardi" },
  { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "We aim above the mark to hit the mark.", author: "Ralph Waldo Emerson" },
  { text: "One important key to success is self-confidence. An important key to self-confidence is preparation.", author: "Arthur Ashe" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change.", author: "Charles Darwin" },
  { text: "Don't say you don't have enough time. You have exactly the same number of hours per day that were given to Helen Keller.", author: "H. Jackson Brown Jr." },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "We don't see things as they are, we see them as we are.", author: "Anaïs Nin" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr." },
  { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare" },
  { text: "Keep your eyes on the stars, and your feet on the ground.", author: "Theodore Roosevelt" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { text: "Once you choose hope, anything's possible.", author: "Christopher Reeve" },
  { text: "You do not find the happy life. You make it.", author: "Camilla Eyring Kimball" },
  { text: "Dost thou love life? Then do not squander time, for that's the stuff life is made of.", author: "Benjamin Franklin" },
  { text: "If you're not making mistakes, then you're not making decisions.", author: "Catherine Cook" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Nothing is worth more than this day.", author: "Johann Wolfgang von Goethe" },
  { text: "Life is short, and it is here to be lived.", author: "Kate Winslet" },
  { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  { text: "Let us make our future now, and let us make our dreams tomorrow's reality.", author: "Malala Yousafzai" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "It is always the simple that produces the marvelous.", author: "Amelia Barr" },
  { text: "Yesterday is not ours to recover, but tomorrow is ours to win or lose.", author: "Lyndon B. Johnson" },
  { text: "Even if you're on the right track, you'll get run over if you just sit there.", author: "Will Rogers" },
  { text: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt" },
  { text: "Let us make our future now, and let us make our dreams tomorrow's reality.", author: "Malala Yousafzai" },
  { text: "The only way to achieve the impossible is to believe it is possible.", author: "Charles Kingsleigh" },
  { text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson" },
  { text: "The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.", author: "Mark Caine" },
  { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
  { text: "If you want to make your dreams come true, the first thing you have to do is wake up.", author: "J.M. Power" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "A truly rich man is one whose children run into his arms when his hands are empty.", author: "Unknown" },
  { text: "Problems are not stop signs, they are guidelines.", author: "Robert H. Schuller" },
  { text: "One way to keep momentum going is to have constantly greater goals.", author: "Michael Korda" },
  { text: "If you genuinely want something, don't wait for it — teach yourself to be impatient.", author: "Gurbaksh Chahal" },
  { text: "The difference between a stumbling block and a stepping stone is how high you raise your foot.", author: "Benny Lewis" },
  { text: "Work hard, be kind, and amazing things will happen.", author: "Conan O'Brien" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Henry Stanley Haskins" },
  { text: "Joy is not in things; it is in us.", author: "Richard Wagner" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "Les Brown" },
  { text: "Life is about making an impact, not making an income.", author: "Kevin Kruse" },
  { text: "How you spend your time is how you spend your life.", author: "Unknown" },
  { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort.", author: "Theodore Roosevelt" },
  { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "If you cannot do great things, do small things in a great way.", author: "Napoleon Hill" },
  { text: "You have to fight through some bad days to earn the best days of your life.", author: "Unknown" },
  { text: "Love the life you live. Live the life you love.", author: "Bob Marley" },
  { text: "The more I want to get something done, the less I call it work.", author: "Richard Bach" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "Just one small positive thought in the morning can change your whole day.", author: "Dalai Lama" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive.", author: "Marcus Aurelius" },
  { text: "Your passion is waiting for your courage to catch up.", author: "Isabelle Lafleche" },
  { text: "Magic is believing in yourself. If you can make that happen, you can make anything happen.", author: "Johann Wolfgang von Goethe" },
  { text: "If you believe it will work out, you'll see opportunities. If you believe it won't, you will see obstacles.", author: "Wayne Dyer" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "You miss 100 percent of the shots you never take.", author: "Wayne Gretzky" },
  { text: "I alone cannot change the world, but I can cast a stone across the water to create many ripples.", author: "Mother Teresa" },
  { text: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.", author: "Jimmy Dean" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Out of difficulties grow miracles.", author: "Jean de la Bruyère" },
  { text: "Someone is sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "You have not lived today until you have done something for someone who can never repay you.", author: "John Bunyan" },
  { text: "The greatest use of a life is to spend it on something that will outlast it.", author: "William James" },
  { text: "There is a crack in everything. That's how the light gets in.", author: "Leonard Cohen" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Float like a butterfly, sting like a bee.", author: "Muhammad Ali" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Henry David Thoreau" },
  { text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr." },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
  { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but they will never forget how you made them feel.", author: "Maya Angelou" },
  { text: "Nothing is impossible; the word itself says 'I'm possible.'", author: "Audrey Hepburn" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "To handle yourself, use your head; to handle others, use your heart.", author: "Eleanor Roosevelt" },
  { text: "Real generosity toward the future lies in giving all to the present.", author: "Albert Camus" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "Be who you are and say what you feel, because those who mind don't matter and those who matter don't mind.", author: "Dr. Seuss" },
  { text: "Those who don't believe in magic will never find it.", author: "Roald Dahl" },
  { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
  { text: "A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
  { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { text: "Have courage and be kind.", author: "Cinderella" },
  { text: "Today you are you. That is truer than true. There is no one alive who is you-er than you.", author: "Dr. Seuss" },
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The quieter you become, the more you are able to hear.", author: "Rumi" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi" },
  { text: "The best dreams happen when you're awake.", author: "Cherie Gilderbloom" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", author: "Bill Keane" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" },
  { text: "No matter what people tell you, words and ideas can change the world.", author: "Robin Williams" },
  { text: "To the world you may be one person, but to one person you may be the world.", author: "Dr. Seuss" },
  { text: "Wherever you are, be all there.", author: "Jim Elliot" },
  { text: "Let your life be your message.", author: "Mahatma Gandhi" },
  { text: "Stay close to anything that makes you glad you are alive.", author: "Hafiz" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Johann Wolfgang von Goethe" },
  { text: "Vulnerability is not weakness. It's our most accurate measure of courage.", author: "Brené Brown" },
  { text: "Owning our story can be hard but not nearly as difficult as spending our lives running from it.", author: "Brené Brown" },
  { text: "You are enough just as you are.", author: "Meghan Markle" },
  { text: "Live in the sunshine, swim in the sea, drink the wild air.", author: "Ralph Waldo Emerson" },
  { text: "There is no exercise better for the heart than reaching down and lifting people up.", author: "John Holmes" },
  { text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
  { text: "Begin anywhere.", author: "John Cage" },
  { text: "Everything you need you already have.", author: "Wayne Dyer" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Love is the bridge between you and everything.", author: "Rumi" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Life itself is the most wonderful fairy tale.", author: "Hans Christian Andersen" },
  { text: "Wherever life plants you, bloom with grace.", author: "French Proverb" },
  { text: "Growth is never by mere chance; it is the result of forces working together.", author: "James Cash Penney" },
  { text: "Gratitude turns what we have into enough.", author: "Aesop" },
  { text: "The greatest wealth is to live content with little.", author: "Plato" },
  { text: "In the midst of winter, I found there was, within me, an invincible summer.", author: "Albert Camus" },
  { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
  { text: "The flower that blooms in adversity is the rarest and most beautiful of all.", author: "Walt Disney" },
  { text: "Enjoy the little things in life, for one day you may look back and realize they were the big things.", author: "Robert Brault" },
  { text: "Give light, and the darkness will disappear of itself.", author: "Desiderius Erasmus" },
  { text: "He who is not courageous enough to take risks will accomplish nothing in life.", author: "Muhammad Ali" },
  { text: "If you're offered a seat on a rocket ship, don't ask what seat. Just get on.", author: "Sheryl Sandberg" },
  { text: "Optimism is the faith that leads to achievement.", author: "Helen Keller" },
  { text: "I would rather die of passion than of boredom.", author: "Vincent Van Gogh" },
  { text: "Just when the caterpillar thought the world was ending, it became a butterfly.", author: "Proverb" },
  { text: "You are never too small to make a difference.", author: "Greta Thunberg" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "You are the artist of your own life. Don't hand the paintbrush to anyone else.", author: "Unknown" },
  { text: "Good things come to those who hustle.", author: "Anaïs Nin" },
  { text: "The mind is not a vessel to be filled but a fire to be ignited.", author: "Plutarch" },
  { text: "To be great is to be misunderstood.", author: "Ralph Waldo Emerson" },
  { text: "Keep going. Everything you need will come to you at the perfect time.", author: "Unknown" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The purpose of life is a life of purpose.", author: "Robert Byrne" },
  { text: "Stop being afraid of what could go wrong and start being excited about what could go right.", author: "Tony Robbins" },
  { text: "The most wasted of all days is one without laughter.", author: "e.e. cummings" },
  { text: "Things do not happen. Things are made to happen.", author: "John F. Kennedy" },
  { text: "When you know better, you do better.", author: "Maya Angelou" },
  { text: "We are all here for some special reason.", author: "Rita Dove" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius" },
  { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { text: "Real change, enduring change, happens one step at a time.", author: "Ruth Bader Ginsburg" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Nothing is impossible to a willing heart.", author: "John Heywood" },
  { text: "The most courageous act is still to think for yourself. Aloud.", author: "Coco Chanel" },
  { text: "Life is a journey, and if you fall in love with the journey, you will be in love forever.", author: "Peter Hagerty" },
  { text: "You must be the change you want to see in the world.", author: "Mahatma Gandhi" },
  { text: "If you have good thoughts they will shine out of your face like sunbeams and you will always look lovely.", author: "Roald Dahl" },
  { text: "In every walk with nature one receives far more than he seeks.", author: "John Muir" },
  { text: "The earth has music for those who listen.", author: "George Santayana" },
  { text: "Don't wait for the perfect moment. Take the moment and make it perfect.", author: "Zoey Sayward" },
  { text: "Everything you've ever wanted is one step outside your comfort zone.", author: "Unknown" },
  { text: "You are confined only by the walls you build yourself.", author: "Andrew Murphy" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Nothing can dim the light that shines from within.", author: "Maya Angelou" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius" },
  { text: "To love what you do and feel that it matters — how could anything be more fun?", author: "Katharine Graham" },
  { text: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate.", author: "Ralph Waldo Emerson" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "It's a funny thing about life, once you begin to take note of the things you are grateful for, you begin to lose sight of the things that you lack.", author: "Germany Kent" },
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
  const [activeTheme, setActiveTheme] = useState("warmPeach");

  const THEMES = {
    warmPeach: {
      name: "Warm Peach", emoji: "☀️",
      bg: "linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 30%, #F5EBE0 60%, #EDE4DA 100%)",
      cardBg: "rgba(255,255,255,0.65)", cardBorder: "rgba(212,165,116,0.15)",
      text: "#3D3028", textMuted: "#8B7355", accent: "#E8976B", accentAlt: "#C4764A",
      accentBg: "rgba(232,151,107,0.15)", accentBgSubtle: "rgba(232,151,107,0.08)",
      moodBorder: "rgba(212,165,116,0.2)", moodBg: "rgba(255,255,255,0.5)", moodHover: "rgba(255,255,255,0.8)",
      navBg: "rgba(255,248,240,0.9)", navBorder: "rgba(212,165,116,0.15)",
      orb1: "rgba(232,151,107,0.12)", orb2: "rgba(196,168,130,0.1)",
      dotColor1: "#D4A574", dotColor2: "#C4956A", dotColor3: "#B8886A",
      tabActive: "#C4764A", tabInactive: "#8B7355",
      syncBg: "rgba(130,180,130,0.1)", syncText: "#5A8A5A",
      avatarBg: "linear-gradient(135deg, rgba(232,151,107,0.15), rgba(232,151,107,0.05))",
      avatarBorder: "#E8976B", avatarGradient: "linear-gradient(135deg, #E8976B, #D4764A)",
      upgradeBg: "rgba(232,151,107,0.12)", signOutBorder: "rgba(200,100,100,0.2)", signOutText: "#A06050",
      isDark: false,
    },
    arcticGlass: {
      name: "Arctic Glass", emoji: "❄️",
      bg: "linear-gradient(150deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      cardBg: "rgba(255,255,255,0.15)", cardBorder: "rgba(255,255,255,0.25)",
      text: "#FFFFFF", textMuted: "rgba(255,255,255,0.6)", accent: "#FFFFFF", accentAlt: "rgba(255,255,255,0.85)",
      accentBg: "rgba(255,255,255,0.2)", accentBgSubtle: "rgba(255,255,255,0.1)",
      moodBorder: "rgba(255,255,255,0.25)", moodBg: "rgba(255,255,255,0.12)", moodHover: "rgba(255,255,255,0.25)",
      navBg: "rgba(255,255,255,0.1)", navBorder: "rgba(255,255,255,0.15)",
      orb1: "rgba(255,255,255,0.08)", orb2: "rgba(240,147,251,0.1)",
      dotColor1: "rgba(255,255,255,0.15)", dotColor2: "rgba(255,255,255,0.1)", dotColor3: "rgba(255,255,255,0.08)",
      tabActive: "#FFFFFF", tabInactive: "rgba(255,255,255,0.5)",
      syncBg: "rgba(255,255,255,0.15)", syncText: "rgba(255,255,255,0.8)",
      avatarBg: "rgba(255,255,255,0.15)", avatarBorder: "rgba(255,255,255,0.5)",
      avatarGradient: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
      upgradeBg: "rgba(255,255,255,0.12)", signOutBorder: "rgba(255,255,255,0.2)", signOutText: "rgba(255,255,255,0.7)",
      isDark: true,
    },
    neoGarden: {
      name: "Neo Garden", emoji: "🌿",
      bg: "linear-gradient(170deg, #E8F5E9 0%, #F1F8E9 30%, #FFF8E1 60%, #FFF3E0 100%)",
      cardBg: "rgba(255,255,255,0.75)", cardBorder: "rgba(76,175,80,0.12)",
      text: "#1B3409", textMuted: "#6B8F5B", accent: "#4CAF50", accentAlt: "#2E7D32",
      accentBg: "rgba(76,175,80,0.12)", accentBgSubtle: "rgba(76,175,80,0.06)",
      moodBorder: "rgba(76,175,80,0.2)", moodBg: "rgba(255,255,255,0.6)", moodHover: "rgba(255,255,255,0.85)",
      navBg: "rgba(255,255,255,0.8)", navBorder: "rgba(76,175,80,0.08)",
      orb1: "rgba(76,175,80,0.08)", orb2: "rgba(139,195,74,0.06)",
      dotColor1: "#4CAF50", dotColor2: "#8BC34A", dotColor3: "#CDDC39",
      tabActive: "#2E7D32", tabInactive: "#6B8F5B",
      syncBg: "rgba(76,175,80,0.12)", syncText: "#2E7D32",
      avatarBg: "rgba(76,175,80,0.1)", avatarBorder: "#4CAF50",
      avatarGradient: "linear-gradient(135deg, #66BB6A, #26A69A)",
      upgradeBg: "rgba(76,175,80,0.1)", signOutBorder: "rgba(200,100,100,0.15)", signOutText: "#A06050",
      isDark: false,
    },
    noirFilm: {
      name: "Noir Film", emoji: "🎬",
      bg: "linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)",
      cardBg: "rgba(255,255,255,0.03)", cardBorder: "rgba(255,255,255,0.06)",
      text: "#D4D0C8", textMuted: "#5A5750", accent: "#D4A574", accentAlt: "#B8865A",
      accentBg: "rgba(212,165,116,0.1)", accentBgSubtle: "rgba(212,165,116,0.06)",
      moodBorder: "rgba(212,165,116,0.15)", moodBg: "rgba(255,255,255,0.04)", moodHover: "rgba(255,255,255,0.08)",
      navBg: "rgba(13,13,13,0.95)", navBorder: "rgba(255,255,255,0.04)",
      orb1: "rgba(212,165,116,0.06)", orb2: "rgba(180,140,100,0.04)",
      dotColor1: "rgba(212,165,116,0.08)", dotColor2: "rgba(180,140,100,0.06)", dotColor3: "rgba(150,120,90,0.05)",
      tabActive: "#D4A574", tabInactive: "#5A5750",
      syncBg: "rgba(130,180,130,0.08)", syncText: "#7A9A6A",
      avatarBg: "rgba(212,165,116,0.08)", avatarBorder: "#D4A574",
      avatarGradient: "linear-gradient(135deg, #D4A574, #B8865A)",
      upgradeBg: "rgba(212,165,116,0.08)", signOutBorder: "rgba(200,100,100,0.15)", signOutText: "#C07060",
      isDark: true,
    },
    sunsetCoast: {
      name: "Sunset Coast", emoji: "🌅",
      bg: "linear-gradient(170deg, #1A1028 0%, #2D1B3D 20%, #4A2040 40%, #8B3A4A 60%, #D4764A 80%, #F0A050 100%)",
      cardBg: "rgba(255,255,255,0.08)", cardBorder: "rgba(255,255,255,0.1)",
      text: "#FFF0E0", textMuted: "rgba(255,240,224,0.5)", accent: "#FFB74D", accentAlt: "#FF8A65",
      accentBg: "rgba(255,183,77,0.15)", accentBgSubtle: "rgba(255,183,77,0.08)",
      moodBorder: "rgba(255,183,77,0.2)", moodBg: "rgba(255,255,255,0.06)", moodHover: "rgba(255,255,255,0.12)",
      navBg: "rgba(26,16,40,0.8)", navBorder: "rgba(255,255,255,0.06)",
      orb1: "rgba(255,160,80,0.08)", orb2: "rgba(200,100,120,0.06)",
      dotColor1: "rgba(255,183,77,0.08)", dotColor2: "rgba(255,140,100,0.06)", dotColor3: "rgba(200,100,80,0.05)",
      tabActive: "#FFB74D", tabInactive: "rgba(255,240,224,0.4)",
      syncBg: "rgba(255,183,77,0.12)", syncText: "#FFB74D",
      avatarBg: "rgba(255,183,77,0.1)", avatarBorder: "#FFB74D",
      avatarGradient: "linear-gradient(135deg, #FFB74D, #FF8A65)",
      upgradeBg: "rgba(255,183,77,0.1)", signOutBorder: "rgba(255,200,150,0.2)", signOutText: "rgba(255,200,150,0.7)",
      isDark: true,
    },
  };

  const th = THEMES[activeTheme] || THEMES.warmPeach;

  const FREE_AI_LIMIT = 3; // Free users get 3 AI uses per day
  const aiUsesLeft = isPremium ? Infinity : Math.max(0, FREE_AI_LIMIT - aiUsesToday);
  const canUseAI = isPremium || aiUsesToday < FREE_AI_LIMIT;

  const dayOfYear = getDayOfYear();
  const dateKey = getDateKey();
  const todayAffirmation = AFFIRMATIONS[seededIndex(dateKey + "aff", AFFIRMATIONS.length)];
  const todayChallenge = CHALLENGES[seededIndex(dateKey + "ch", CHALLENGES.length)];
  const todayGratitude = GRATITUDE_PROMPTS[seededIndex(dateKey + "gr", GRATITUDE_PROMPTS.length)];
  const todayQuote = (() => {
    // No-repeat quote cycle: track seen indices in localStorage, cycle through all before repeating
    const storageKey = "shine-quote-cycle";
    const todayKey = "shine-quote-today-" + dateKey;
    try {
      const todayIdx = localStorage.getItem(todayKey);
      if (todayIdx !== null) return QUOTES[parseInt(todayIdx, 10)];
      let seen = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (seen.length >= QUOTES.length) seen = [];
      const remaining = QUOTES.map((_, i) => i).filter(i => !seen.includes(i));
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      seen.push(pick);
      localStorage.setItem(storageKey, JSON.stringify(seen));
      localStorage.setItem(todayKey, String(pick));
      return QUOTES[pick];
    } catch {
      return QUOTES[seededIndex(dateKey + "qt", QUOTES.length)];
    }
  })();

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
      try {
        const themeRes = await storage.get("shine-theme");
        if (themeRes) setActiveTheme(JSON.parse(themeRes.value));
      } catch {}
      setLoaded(true);
      setTimeout(() => setAnimateIn(true), 100);
      
      // Show welcome guide for first-time users
      try {
        const hasSeenWelcome = await storage.get("shine-welcome-seen");
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
      background: th.bg,
      fontFamily: "'Instrument Serif', 'Georgia', serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 20% 50%, ${th.dotColor1} 1px, transparent 1px),
                          radial-gradient(circle at 80% 20%, ${th.dotColor2} 1px, transparent 1px),
                          radial-gradient(circle at 60% 80%, ${th.dotColor3} 1px, transparent 1px)`,
        backgroundSize: "60px 60px, 80px 80px, 100px 100px"
      }} />

      {/* Floating orbs */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: `radial-gradient(circle, ${th.orb1} 0%, transparent 70%)`,
        pointerEvents: "none", animation: "float 20s ease-in-out infinite"
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-10%", width: 500, height: 500,
        borderRadius: "50%", background: `radial-gradient(circle, ${th.orb2} 0%, transparent 70%)`,
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
          0%, 100% { box-shadow: 0 0 20px ${th.accentBgSubtle}; }
          50% { box-shadow: 0 0 40px ${th.accentBg}; }
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
          background: ${th.cardBg};
          backdrop-filter: blur(20px);
          border: 1px solid ${th.cardBorder};
          border-radius: 24px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px ${th.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(180,140,100,0.1)'};
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
          color: ${th.tabInactive};
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        
        .tab-btn.active {
          background: ${th.accentBg};
          color: ${th.tabActive};
          font-weight: 600;
        }
        
        .mood-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid ${th.moodBorder};
          background: ${th.moodBg};
          cursor: pointer;
          font-size: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .mood-btn:hover {
          transform: scale(1.15);
          border-color: ${th.accent};
          background: ${th.moodHover};
        }
        
        .mood-btn.selected {
          border-color: ${th.accent};
          background: ${th.accentBg};
          transform: scale(1.1);
          box-shadow: 0 4px 20px ${th.accentBgSubtle};
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
            border: `1px solid ${th.cardBorder}`,
            background: th.isDark ? "rgba(255,255,255,0.05)" : th.moodBg,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: th.textMuted, fontWeight: 600, transition: "all 0.3s"
          }}>
            ?
          </button>
          {/* Account button */}
          <button onClick={() => setActiveTab("account")} style={{
            position: "absolute", top: 30, right: 0,
            width: 36, height: 36, borderRadius: "50%",
            border: user ? `2px solid ${th.accent}` : `1px solid ${th.cardBorder}`,
            background: user ? th.avatarBg : (th.isDark ? "rgba(255,255,255,0.05)" : th.moodBg),
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: user ? 14 : 16,
            color: user ? th.accentAlt : th.textMuted, fontWeight: 600,
            transition: "all 0.3s"
          }}>
            {user ? (user.email?.[0]?.toUpperCase() || "U") : "👤"}
          </button>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: th.accentBgSubtle, padding: "8px 20px",
            borderRadius: 100, marginBottom: 16,
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            color: th.accent, fontWeight: 500, letterSpacing: "0.5px"
          }}>
            ☀️ Daily Shine
            {streak > 0 && (
              <span style={{
                background: `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`,
                color: "white", padding: "3px 10px", borderRadius: 100,
                fontSize: 12, fontWeight: 600,
                animation: streak >= 3 ? "streakPulse 2s ease-in-out infinite" : "none"
              }}>
                🔥 {streak} day{streak !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 400, color: th.text,
            lineHeight: 1.2, marginBottom: 6
          }}>
            {greetingName()} ✨
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: th.textMuted, fontWeight: 300
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
              background: done ? `linear-gradient(90deg, ${th.accent}, ${th.accentAlt})` : th.accentBgSubtle,
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            }} />
          ))}
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            color: th.textMuted, marginLeft: 8
          }}>
            {completionCount}/3 today
          </span>
        </div>

        {/* ===== HOME TAB ===== */}
        {activeTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Affirmation Card */}
            <div className="card" style={{
              background: th.isDark ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, rgba(232,151,107,0.12) 0%, rgba(255,255,255,0.7) 100%)",
              textAlign: "center", padding: "36px 32px",
              animation: "fadeUp 0.6s ease-out"
            }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: th.accent, marginBottom: 16, fontWeight: 600
              }}>
                Today's Affirmation
              </div>
              <p style={{
                fontSize: 22, lineHeight: 1.5, color: th.text,
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
                color: th.textMuted, marginBottom: 20, fontWeight: 600
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
                      color: currentMood === mood.value ? th.accent : th.textMuted,
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
                  background: th.accentBgSubtle, borderRadius: 16,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: th.textMuted, textAlign: "center",
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
                  color: th.textMuted, fontWeight: 600
                }}>
                  Today's Challenge
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  background: th.cardBorder, padding: "4px 12px",
                  borderRadius: 100, color: "#A8886A", fontWeight: 500
                }}>
                  {todayChallenge.category}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={toggleChallenge} style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  border: challengeCompleted ? "none" : `2px solid ${th.cardBorder}`,
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
                color: th.textMuted, marginBottom: 16, fontWeight: 600
              }}>
                Gratitude Moment
              </div>
              <p style={{
                fontSize: 17, color: th.text, marginBottom: 16, lineHeight: 1.4,
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
                      background: th.moodBg, border: `1px solid ${th.cardBorder}`,
                      borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, color: "#4A3F35", resize: "vertical",
                      outline: "none", transition: "border-color 0.3s"
                    }}
                    onFocus={e => e.target.style.borderColor = `${th.accent}`}
                    onBlur={e => e.target.style.borderColor = th.accentBgSubtle}
                  />
                  <button onClick={saveGratitude} style={{
                    marginTop: 12, padding: "10px 24px", borderRadius: 100,
                    border: "none", background: gratitudeText.trim() ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})` : th.accentBgSubtle,
                    color: gratitudeText.trim() ? "white" : th.textMuted,
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
                color: th.textMuted, marginBottom: showQuote ? 16 : 0, fontWeight: 600,
                transition: "margin 0.3s"
              }}>
                {showQuote ? "Quote of the Day" : "Tap for today's quote ✦"}
              </div>
              {showQuote && (
                <div style={{ animation: "fadeUp 0.4s ease-out" }}>
                  <p style={{ fontSize: 18, color: th.text, fontStyle: "italic", lineHeight: 1.5, marginBottom: 12 }}>
                    "{todayQuote.text}"
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: th.textMuted }}>
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
                color: th.textMuted, marginBottom: 24, fontWeight: 600
              }}>
                Box Breathing
              </div>
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                margin: "0 auto 24px",
                background: breathingActive
                  ? `radial-gradient(circle, ${th.accent}4D 0%, ${th.accent}0D 70%)`
                  : `radial-gradient(circle, ${th.accentBgSubtle} 0%, transparent 70%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.5s",
                animation: breathingActive ? "breathe 4s ease-in-out infinite" : "none"
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: breathingActive
                    ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`
                    : th.accentBgSubtle,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.5s"
                }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: breathingActive ? "white" : th.textMuted, fontWeight: 500
                  }}>
                    {breathingActive ? breathCount + "/4" : "🌬️"}
                  </span>
                </div>
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 18,
                color: th.text, marginBottom: 20, minHeight: 28, fontWeight: 300
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
                  : `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`,
                color: breathingActive ? th.textMuted : "white",
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
                color: th.textMuted, marginBottom: 20, fontWeight: 600
              }}>
                3 Wins Today
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, marginBottom: 16
              }}>
                Even small victories count. What went right?
              </p>
              {!winsSaved ? (
                <div>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: th.accentBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: th.accent, fontWeight: 600, flexShrink: 0
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
                          background: th.moodBg,
                          border: `1px solid ${th.cardBorder}`,
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
                      ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})` : th.accentBgSubtle,
                    color: winsText.some(w => w.trim()) ? "white" : th.textMuted,
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
            <AskCoachCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} th={th} />

            {/* AI Reframe Tool */}
            <ReframeCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} th={th} />

            {/* Self-Compassion Letter */}
            <CompassionCard canUseAI={canUseAI} aiUsesLeft={aiUsesLeft} isPremium={isPremium} trackAIUse={trackAIUse} onUpgrade={() => setShowUpgrade(true)} th={th} />

            {/* Random Act of Kindness */}
            <RandomActCard th={th} />
          </div>
        )}

        {/* ===== LEARN TAB ===== */}
        {activeTab === "learn" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center", padding: "10px 0 0", animation: "fadeUp 0.5s ease-out" }}>
              <h2 style={{ fontSize: 26, color: th.text, fontWeight: 400, marginBottom: 6 }}>
                Positivity Library
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: th.textMuted }}>
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
                  background: learnCategory === cat.id ? th.accentBg : th.moodBg,
                  color: learnCategory === cat.id ? th.accent : th.textMuted,
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
                    background: isOpen ? th.moodHover : undefined
                  }} onClick={() => setExpandedGuide(isOpen ? null : guide.id)}>
                    
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 16,
                        background: th.accentBgSubtle,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0
                      }}>
                        {guide.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontFamily: "'Instrument Serif', Georgia, serif",
                          fontSize: 18, color: th.text, fontWeight: 400, marginBottom: 4
                        }}>
                          {guide.title}
                        </h3>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                            color: th.textMuted
                          }}>
                            ⏱ {guide.time}
                          </span>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                            background: th.accentBg, padding: "3px 8px",
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
                        color: th.textMuted, marginTop: 10, lineHeight: 1.4
                      }}>
                        {guide.preview}
                      </p>
                    )}

                    {/* Full Content */}
                    {isOpen && (
                      <div style={{
                        marginTop: 20, paddingTop: 20,
                        borderTop: `1px solid ${th.cardBorder}`,
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
                                background: `linear-gradient(135deg, ${th.accentBg}, ${th.accentBgSubtle})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                color: th.accent, fontWeight: 700
                              }}>
                                {block.num}
                              </div>
                              <div>
                                <h4 style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                                  color: th.text, fontWeight: 600, marginBottom: 4
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
                                color: th.syncText, lineHeight: 1.5
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
                fontSize: 24, color: th.text, fontWeight: 400, marginBottom: 6
              }}>
                Evening Wind-Down
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: th.textMuted
              }}>
                Take a few quiet minutes to close out your day.
              </p>
            </div>

            {/* Day Rating */}
            <div className="card" style={{ animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: th.textMuted, marginBottom: 20, fontWeight: 600
              }}>
                Rate Your Day
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => !eveningSaved && setEveningRating(n)} style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: eveningRating === n ? "2px solid #9B7DC8" : `1px solid ${th.cardBorder}`,
                    background: eveningRating !== null && n <= eveningRating 
                      ? `rgba(155,125,200,${0.1 + (n/10) * 0.3})`
                      : th.moodBg,
                    cursor: eveningSaved ? "default" : "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: eveningRating !== null && n <= eveningRating ? th.accent : th.textMuted,
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
                color: th.textMuted, marginBottom: 16, fontWeight: 600
              }}>
                Reflect on Today
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, marginBottom: 14, fontStyle: "italic"
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
                    background: th.moodBg, border: "1px solid rgba(155,125,200,0.2)",
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
                color: th.textMuted, marginBottom: 16, fontWeight: 600
              }}>
                🎈 Let It Go
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, marginBottom: 14
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
                    background: th.moodBg, border: `1px solid ${th.cardBorder}`,
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
                color: th.textMuted, marginBottom: 16, fontWeight: 600
              }}>
                Tomorrow's Intention
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, marginBottom: 14
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
                    background: th.moodBg, border: `1px solid ${th.cardBorder}`,
                    borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, color: "#4A3F35", outline: "none"
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, background: th.accentBgSubtle,
                  borderRadius: 16, fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 17, color: th.accent, fontStyle: "italic", textAlign: "center"
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
                  : th.accentBgSubtle,
                color: (eveningRating || eveningReflection.trim()) ? "white" : th.textMuted,
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
                  fontSize: 20, color: th.text, fontStyle: "italic", lineHeight: 1.4
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
                color: th.syncText, marginBottom: 16, fontWeight: 600
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
                fontSize: 22, color: th.text, fontWeight: 400, marginBottom: 4
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
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: th.textMuted
                  }}>
                    {totalSeeds} seeds planted · {nextStage.minSeeds - totalSeeds} more to reach {nextStage.emoji} {nextStage.name}
                  </p>
                </div>
              )}
              {!nextStage && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  color: th.syncText, fontWeight: 500
                }}>
                  🎉 Maximum bloom! {totalSeeds} seeds planted. You've built a paradise!
                </p>
              )}

              {/* Seed breakdown */}
              <div style={{
                marginTop: 16, padding: "12px 16px",
                background: th.moodBg, borderRadius: 14,
                display: "flex", justifyContent: "space-around",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: th.textMuted
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
                  color: th.textMuted, fontWeight: 600
                }}>
                  Mood Trend
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[7, 14, 30].map(range => (
                    <button key={range} onClick={() => setMoodViewRange(range)} style={{
                      padding: "4px 12px", borderRadius: 100, border: "none",
                      background: moodViewRange === range ? th.accentBg : "transparent",
                      color: moodViewRange === range ? th.accent : th.textMuted,
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
                    background: th.accentBgSubtle
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
                            <stop offset="0%" stopColor={th.accent} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={th.accent} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={areaData} fill="url(#moodGrad)" />
                        <path d={pathData} fill="none" stroke={th.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={th.accent} strokeWidth="2" />
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
                  background: th.accentBgSubtle, borderRadius: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13
                }}>
                  <span style={{ color: th.textMuted }}>Average mood ({moodViewRange} days)</span>
                  <span style={{ color: th.accent, fontWeight: 600 }}>
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
                  color: th.textMuted, fontWeight: 600
                }}>
                  🧠 Weekly Insight
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                  background: "linear-gradient(135deg, rgba(107,162,107,0.15), rgba(107,162,107,0.05))",
                  padding: "4px 10px", borderRadius: 100,
                  color: th.syncText, fontWeight: 600
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
                      fontSize: 20, color: th.text, fontWeight: 400
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
                    fontSize: 13, color: th.syncText
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
                    color: th.textMuted, marginBottom: 16
                  }}>
                    Get a personalized analysis of your mood patterns and journal entries.
                  </p>
                  <button onClick={generateInsight} disabled={insightLoading} style={{
                    padding: "12px 28px", borderRadius: 100, border: "none",
                    background: insightLoading ? th.accentBgSubtle : "linear-gradient(135deg, #6BA26B, #5A8A5A)",
                    color: insightLoading ? th.textMuted : "white",
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
                color: th.textMuted, marginBottom: 20, fontWeight: 600
              }}>
                Your Stats
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Current Streak", value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: "🔥", color: th.accent },
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
                      color: th.text, fontWeight: 600, marginBottom: 2
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: th.textMuted
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
                color: th.textMuted, marginBottom: 20, fontWeight: 600
              }}>
                Journal History
              </div>
              {getJournalDays().length === 0 ? (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: th.textMuted, textAlign: "center", padding: "20px 0"
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
                          background: isExpanded ? th.accentBgSubtle : th.isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.4)",
                          border: `1px solid ${th.cardBorder}`,
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
                                color: th.text, fontWeight: 500
                              }}>
                                {entry.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              {!isExpanded && entry.gratitude && (
                                <div style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                  color: th.textMuted, marginTop: 2,
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
                            borderTop: `1px solid ${th.cardBorder}`,
                            animation: "fadeUp 0.3s ease-out"
                          }}>
                            {entry.gratitude && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{
                                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                                  color: th.accent, fontWeight: 600, marginBottom: 4,
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
                                  color: th.accent, fontWeight: 600, marginBottom: 4,
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
                fontSize: 18, color: th.text, fontStyle: "italic", lineHeight: 1.5
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
              background: th.isDark ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, rgba(232,151,107,0.08), rgba(255,255,255,0.7))"
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
                background: user ? th.avatarGradient : th.accentBgSubtle,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: user ? 28 : 32, color: "white", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700
              }}>
                {user ? (user.email?.[0]?.toUpperCase() || "U") : "👤"}
              </div>
              {user ? (
                <div>
                  <h2 style={{ fontSize: 22, color: th.text, fontWeight: 400, marginBottom: 4 }}>
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "You"}
                  </h2>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: th.textMuted, marginBottom: 4
                  }}>
                    {user.email}
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: th.syncBg, padding: "4px 12px",
                    borderRadius: 100, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, color: th.syncText, fontWeight: 500
                  }}>
                    ☁️ Synced to cloud
                  </div>
                </div>
              ) : null}
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ animation: "fadeUp 0.55s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: th.textMuted, marginBottom: 16, fontWeight: 600
              }}>
                Theme
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTheme(key);
                      storage.set("shine-theme", JSON.stringify(key));
                    }}
                    style={{
                      padding: "12px 10px", borderRadius: 16,
                      border: activeTheme === key
                        ? `2px solid ${theme.accent}`
                        : `1px solid ${th.cardBorder}`,
                      background: activeTheme === key
                        ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)')
                        : 'transparent',
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{theme.emoji}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                      color: activeTheme === key ? th.accent : th.textMuted,
                      fontWeight: activeTheme === key ? 600 : 400,
                    }}>
                      {theme.name}
                    </div>
                    {/* Mini preview bar */}
                    <div style={{
                      marginTop: 6, height: 4, borderRadius: 2, overflow: "hidden",
                      background: theme.bg,
                      border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase", letterSpacing: 2,
                color: th.textMuted, marginBottom: 16, fontWeight: 600
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
                    background: th.moodBg,
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 18,
                      color: th.text, fontWeight: 600
                    }}>{stat.value}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: th.textMuted
                    }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade / Pro status */}
            <div className="card" style={{
              animation: "fadeUp 0.7s ease-out", cursor: "pointer",
              background: isPremium
                ? `linear-gradient(135deg, ${th.accentBgSubtle}, ${th.cardBg})`
                : undefined
            }} onClick={() => setShowUpgrade(true)}>
              <div style={{
                display: "flex", alignItems: "center", gap: 14
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: isPremium
                    ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`
                    : th.accentBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22
                }}>
                  {isPremium ? "✦" : "⬆️"}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                    color: th.text, fontWeight: 600, marginBottom: 2
                  }}>
                    {isPremium ? "Daily Shine Pro" : "Upgrade to Pro"}
                  </h3>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: th.textMuted
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
              color: th.textMuted, cursor: "pointer", textAlign: "center"
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
            color: th.accent
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
            color: th.accent
          },
          {
            icon: "🚀",
            title: "You're all set!",
            desc: "Start by logging your mood on the Today tab. Every small step counts. Your positivity journey begins now!",
            color: th.accentAlt
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
                fontSize: 22, color: th.text, fontWeight: 400,
                marginBottom: 10, fontFamily: "'Playfair Display', serif"
              }}>
                {slide.title}
              </h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, lineHeight: 1.6, marginBottom: 28
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
                    color: th.textMuted, cursor: "pointer", fontWeight: 500
                  }}>
                    Back
                  </button>
                )}
                <button onClick={() => {
                  if (isLast) {
                    storage.set("shine-welcome-seen", JSON.stringify(true));
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
                  storage.set("shine-welcome-seen", JSON.stringify(true));
                  setShowWelcome(false);
                }} style={{
                  marginTop: 12, padding: "8px", border: "none",
                  background: "transparent", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, color: th.textMuted, cursor: "pointer"
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
              <h2 style={{ fontSize: 26, color: th.text, fontWeight: 400, marginBottom: 8 }}>
                Unlock Daily Shine Pro
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: th.textMuted, lineHeight: 1.5
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
                : `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`,
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
                fontSize: 12, color: th.textMuted
              }}>
                Free users get {FREE_AI_LIMIT} AI uses per day
              </p>
            )}

            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: "10px", borderRadius: 100,
              border: "none", background: "transparent",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: th.textMuted, cursor: "pointer"
            }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: th.navBg, backdropFilter: "blur(20px)",
        borderTop: `1px solid ${th.navBorder}`,
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

function RandomActCard({ th }) {
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
    "Compliment a coworker or classmate sincerely",
    "Send flowers or a small gift to someone unexpectedly",
    "Donate to a cause you care about, even a small amount",
    "Make someone laugh today",
    "Check in on a friend you haven't spoken to in a while",
    "Share something useful you learned with someone who'd appreciate it",
    "Offer your seat to someone who needs it",
    "Write a kind comment on someone's creative work online",
    "Cook or bake something and share it",
    "Listen — really listen — to someone without interrupting",
    "Forgive someone (or yourself) for something small",
    "Send a handwritten note to someone who'd never expect it",
    "Recommend a book, show, or podcast that changed you",
    "Volunteer 30 minutes of your time for something that matters",
    "Tell someone's manager or boss what a great job they did",
    "Pay for someone's coffee or meal anonymously",
    "Write an encouraging note and leave it somewhere public",
    "Call your mom, dad, or someone who raised you — just to say hi",
    "Compliment someone's work in front of their boss or peers",
    "Leave a generous tip and a kind note for your server",
    "Send a handwritten card to someone who'd never expect it",
    "Pick up litter on your walk today",
    "Let someone merge in traffic without frustration",
    "Tell a friend one specific thing you love about them",
    "Donate unused clothes or items to a local shelter",
    "Leave a 5-star review for a small business that deserves it",
    "Send flowers to someone who needs cheering up",
    "Offer to babysit or help a parent who needs a break",
    "Check in on a neighbor — especially an elderly one",
    "Share a useful skill or tip with someone for free",
    "Volunteer for an hour at a local organization",
    "Write a thank-you email to a teacher who impacted your life",
    "Smile and make eye contact with everyone you pass today",
    "Buy a homeless person a meal and sit with them if they want company",
    "Leave a book you loved in a public place for someone to find",
    "Help someone carry their groceries or heavy bags",
    "Text three people a specific reason you're grateful for them",
    "Introduce two people in your network who should know each other",
    "Leave a care package on a neighbor's doorstep",
    "Send a 'thinking of you' card to someone going through a hard time",
    "Mow or rake a neighbor's yard without being asked",
    "Donate blood if you're able",
    "Share a job listing with someone who might need it",
    "Give a genuine compliment to a service worker today",
    "Cook extra dinner and share it with someone nearby",
    "Hold the elevator even when you're in a rush",
    "Offer your umbrella to someone caught in the rain",
    "Write a positive note on someone's windshield",
    "Teach someone something you know that they've wanted to learn",
    "Listen fully to someone without offering advice — just presence",
    "Celebrate someone else's win as loudly as you'd celebrate your own",
    "Surprise a coworker with their favorite snack",
    "Offer to proofread or help someone with something they're struggling with",
    "Give up your parking spot to someone who needs it more",
    "Buy a gift card to a local restaurant and give it to a stranger",
    "Leave an uplifting voicemail for someone who might be lonely",
    "Collect donations for a cause your community cares about",
    "Lend a book you love with a personal note inside the cover",
    "Offer directions or help to someone who looks lost",
    "Write a recommendation letter or LinkedIn endorsement for someone",
    "Share a meal with someone who lives alone",
    "Say 'thank you' to a police officer, firefighter, or paramedic",
    "Leave a positive comment on someone's creative work online",
    "Donate to a local food bank — even just a few items",
    "Plan a surprise for someone who never expects to be celebrated",
    "Help someone move, paint, or tackle a big task they've been dreading",
    "Mentor someone who is where you used to be",
    "Actively include someone who seems left out of a group",
    "Share a resource, book, or course that genuinely helped you",
    "Offer your professional skills pro bono to a nonprofit",
    "Give a child in your life your full, undivided attention for an hour",
    "Be the person who speaks up when someone is being treated unfairly",
    "Start a gratitude chain — text someone something you're grateful for about them and ask them to pass it on",
    "Plant something — a seed, a flower, a tree — for future generations",
    "Leave a generous and kind Amazon or Google review for a small seller",
    "Tell someone's manager or supervisor how excellent their service was",
    "Forgive someone who hasn't apologized — for your own peace",
    "Actively listen to a child's story without rushing or checking your phone",
    "Help a friend practice for an interview, presentation, or difficult conversation",
    "Leave your parking meter with time still on it",
    "Bring treats to share with coworkers or classmates unexpectedly",
    "Print and frame a photo for someone who'd cherish it",
    "Send someone a playlist curated just for what they're going through",
    "Look someone in the eye and say 'You're doing a great job'",
    "Pay for the person behind you at the drive-through",
    "Spend time with an elderly person and truly listen to their stories",
    "Help a child with homework or a project they're frustrated with",
    "Organize a neighborhood cleanup for an hour",
    "Send a 'you matter' message to someone you worry might need to hear it",
    "Share a local business you love on social media",
    "Write a heartfelt birthday message instead of a quick 'HBD'",
    "Tell the truth kindly when someone asks for your honest opinion",
    "Stand up for someone's idea in a meeting when others dismiss it",
    "Give someone the benefit of the doubt today instead of assuming the worst",
    "Create a moment of joy for a stranger — a joke, a gesture, a small gift",
    "Reconnect with a friend you've been out of touch with",
    "Be the one who takes notes and shares them so others don't have to",
    "Carry an extra umbrella and give it to someone caught in the rain",
    "Ask someone how they're really doing — and mean it",
    "Champion someone else's cause or project like it's your own",
    "Read to a child, a patient, or anyone who'd appreciate it",
    "Be the person in the room who makes everyone feel included",
    "Write 'you are loved' on a sticky note and leave it somewhere it'll be found",
    "Offer to be someone's emergency contact or support person",
    "Actively thank someone for a habit of kindness you've taken for granted",
    "Walk someone to their car at night if they're alone",
    "Teach a child or someone new to your hobby something you love",
    "Gift someone a skill — a lesson, a class, a session of your expertise",
    "Be the person who remembers details and follows up — 'how did that thing go?'",
    "Speak kindly about someone behind their back",
    "Start a conversation with someone who looks lonely or left out",
    "Donate your birthday to a cause instead of gifts",
    "Bring coffee for the whole office or group unexpectedly",
    "Write a kind letter to a child in the hospital or a soldier overseas",
    "Notice who does invisible labor around you and acknowledge them",
    "Give your full, cheerful presence to someone who rarely gets it from you",
    "Do something for someone that they'll never know you did",
    "Be someone's hype person today — tell everyone their good news louder than they would",
    "Leave a note in a library book for the next reader",
    "Give a genuine, specific compliment to someone about their character, not appearance",
    "Show up for someone's event or milestone even when it's inconvenient",
    "Make someone laugh today when they least expect it",
    "Make a child feel like the most important person in the room",
    "Tell someone what they mean to you before it's too late",
    "Be the one who remembers and celebrates people's 'little big moments'",
    "Thank the people who clean your office, building, or public space",
    "Stop and help when you see someone struggling, even if you're in a hurry",
    "Put your phone away and give someone your whole self for a conversation",
    "Write a short, honest appreciation for someone in your life and read it to them",
    "Be as enthusiastic about someone else's success as you would be about your own",
    "Commit to gossiping only kindly today — if you talk about someone, say something good",
    "Buy a meal kit or groceries for a family going through a hard time",
    "Ask an older person in your life to teach you something they know",
    "Create a tradition with someone you love — something small and repeatable",
    "Give someone a second chance they didn't ask for",
    "Notice what someone needs before they ask and quietly provide it",
    "Acknowledge someone's hard work that usually goes unnoticed",
    "Be the person who slows down and savors connection instead of rushing through it",
    "Tell a child something that will build their confidence and stick with them",
    "Make the first move in repairing a relationship that matters",
    "Leave a place better than you found it — a restroom, a park, a shared kitchen",
    "Give someone the last of something you both want",
    "Write down what you love about your people and tell them",
    "Show up to support someone doing something brave or scary",
    "Pass along an opportunity that isn't right for you but might be perfect for someone else",
    "Give a gift of your time — your full, present, unrushed time — to someone who needs it",
    "Be the energy in the room that makes other people feel good about themselves",
    "Do something today that you'd want someone to do for you — and don't wait to be asked",
    "Hold space for someone who is going through something you don't fully understand",
    "Share your story with someone who might need to hear it",
    "Surprise someone with a memory — 'I was thinking about that time when...'",
    "Let someone know they changed your life, even in a small way",
    "Be the one who says 'I'm proud of you' when no one else does",
    "Take care of something for someone who is overwhelmed",
    "Treat the next person who serves you like the most important part of your day",
    "Leave the world slightly better than it was when you woke up this morning",
  ];


  const generate = () => {
    // No-repeat cycle using sessionStorage
    try {
      let seen = JSON.parse(sessionStorage.getItem("shine-acts-seen") || "[]");
      if (seen.length >= acts.length) seen = [];
      const remaining = acts.filter((a, i) => !seen.includes(i) && a !== act);
      const idx = acts.indexOf(remaining[Math.floor(Math.random() * remaining.length)]);
      seen.push(idx);
      sessionStorage.setItem("shine-acts-seen", JSON.stringify(seen));
      setAct(acts[idx]);
    } catch {
      let newAct;
      do { newAct = acts[Math.floor(Math.random() * acts.length)]; } while (newAct === act);
      setAct(newAct);
    }
  };

  return (
    <div className="card" style={{ textAlign: "center", animation: "fadeUp 0.8s ease-out" }}>
      <div style={{
        fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        textTransform: "uppercase", letterSpacing: 2,
        color: th.textMuted, marginBottom: 20, fontWeight: 600
      }}>
        Random Act of Kindness
      </div>
      {act && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 16,
          color: th.text, marginBottom: 20, lineHeight: 1.5,
          animation: "fadeUp 0.4s ease-out"
        }}>
          💛 {act}
        </p>
      )}
      <button onClick={generate} style={{
        padding: "12px 28px", borderRadius: 100, border: "none",
        background: `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`,
        color: "white", fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "all 0.3s"
      }}>
        {act ? "Another One ✨" : "Generate an Act 💛"}
      </button>
    </div>
  );
}

function ReframeCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade, th }) {
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
          color: th.textMuted, fontWeight: 600
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
              background: `linear-gradient(135deg, ${th.accentBg}, ${th.accentBgSubtle})`,
              padding: "4px 8px", borderRadius: 100,
              color: th.accent, fontWeight: 600
            }}>
              ✦ PRO
            </span>
          )}
        </div>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        color: th.textMuted, marginBottom: 16, lineHeight: 1.5
      }}>
        Type a negative thought and get a healthier perspective.
      </p>

      <textarea
        value={negativeThought}
        onChange={e => setNegativeThought(e.target.value)}
        placeholder={`e.g., "I'm not good enough" or "Everything always goes wrong"`}
        style={{
          width: "100%", minHeight: 72, padding: 16,
          background: th.moodBg, border: `1px solid ${th.cardBorder}`,
          borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: "#4A3F35", resize: "vertical",
          outline: "none", transition: "border-color 0.3s"
        }}
        onFocus={e => e.target.style.borderColor = "rgba(107,162,232,0.4)"}
        onBlur={e => e.target.style.borderColor = th.accentBgSubtle}
      />

      <button onClick={reframe} disabled={loading || !negativeThought.trim()} style={{
        marginTop: 12, padding: "12px 28px", borderRadius: 100,
        border: "none",
        background: (negativeThought.trim() && !loading)
          ? "linear-gradient(135deg, #6BA2E8, #5B8AC4)"
          : th.accentBgSubtle,
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
            color: th.textMuted, fontStyle: "italic"
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
              fontSize: 19, color: th.text, lineHeight: 1.5,
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
              fontSize: 13, color: th.syncText
            }}>
              ⚡ <strong>Try this:</strong> {reframedThought.action}
            </div>
          </div>

          {/* Reset button */}
          <button onClick={() => { setNegativeThought(""); setReframedThought(null); }} style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 100,
            border: `1px solid ${th.cardBorder}`, background: "transparent",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: th.textMuted, cursor: "pointer", transition: "all 0.3s"
          }}>
            Reframe another thought
          </button>
        </div>
      )}

      {/* History count */}
      {history.length > 1 && (
        <div style={{
          marginTop: 16, textAlign: "center",
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: th.textMuted
        }}>
          You've reframed {history.length} thoughts today ✨
        </div>
      )}
    </div>
  );
}

function CompassionCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade, th }) {
  const [situation, setSituation] = useState("");
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);

  const LOCAL_LETTERS = [
    { greeting: "Hey, I see you right now.", body: "What you're going through is hard, and it's okay to feel the weight of it. You don't have to have it all figured out today. Just being here, still trying — that says more about your strength than you realize.", closing: "With all the kindness you deserve,", signature: "Your Kinder Self" },
    { greeting: "Hi, I know today is heavy.", body: "You're carrying more than most people see, and that takes real courage. Give yourself the same grace you'd give your best friend. You're not falling apart — you're being human.", closing: "Gently and with love,", signature: "The Part of You That Knows Better" },
    { greeting: "Hey, take a breath with me.", body: "Whatever happened today doesn't define you. You've been through hard things before and you're still here. That resilience? It's not nothing — it's everything.", closing: "You've got this. I promise.", signature: "Your Compassionate Side" },
    { greeting: "I know you're being hard on yourself.", body: "But here's what I see: someone who cares deeply, tries their best, and holds themselves to a standard they'd never impose on anyone else. Ease up. You deserve your own kindness.", closing: "With warmth and no judgment,", signature: "Your Wiser Self" },
    { greeting: "Hey, it's okay to not be okay.", body: "You don't need to perform strength right now. Sometimes the bravest thing is admitting you're struggling. Tomorrow will come with its own energy — for now, just let yourself be where you are.", closing: "Always in your corner,", signature: "Your Kinder Self" },
    { greeting: "I want you to hear something.", body: "You are not the worst thing that happened to you, and you are not your hardest day. The fact that you're still showing up — even imperfectly — is a form of courage most people don't recognize in themselves.", closing: "So much love for you,", signature: "Your Deeper Self" },
    { greeting: "You don't have to earn rest.", body: "You're allowed to slow down, to feel whatever this is, without immediately trying to fix it or push past it. Sometimes sitting with discomfort is the work. You're doing it right now.", closing: "Be gentle with yourself today,", signature: "Your Wiser Self" },
    { greeting: "I notice you're struggling.", body: "And I want you to know: struggle doesn't mean failure. It means you're in the middle of something real. You don't have to skip to the lesson — you're allowed to just be in it for a while.", closing: "With patience and no rush,", signature: "The Part of You That Cares" },
    { greeting: "You are so much more than this moment.", body: "Whatever's weighing on you right now — it's real, and it matters. But it's not the whole story. You have done hard things before, and there's more good ahead than you can see from here.", closing: "Rooting for you always,", signature: "Your Future Self" },
    { greeting: "Hey, stop for a second.", body: "You've been going so hard, holding so much. Put it down for a minute. You're allowed to just exist without earning your place. You matter not because of what you do, but because of who you are.", closing: "With all the softness you deserve,", signature: "Your Kinder Self" },
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
          color: th.textMuted, fontWeight: 600
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
        color: th.textMuted, marginBottom: 16, lineHeight: 1.5
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
              background: th.moodBg, border: `1px solid ${th.cardBorder}`,
              borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: "#4A3F35", resize: "vertical",
              outline: "none", transition: "border-color 0.3s"
            }}
            onFocus={e => e.target.style.borderColor = "rgba(180,130,196,0.4)"}
            onBlur={e => e.target.style.borderColor = th.accentBgSubtle}
          />
          <button onClick={generateLetter} disabled={loading || !situation.trim()} style={{
            marginTop: 12, padding: "12px 28px", borderRadius: 100,
            border: "none",
            background: (situation.trim() && !loading)
              ? "linear-gradient(135deg, #B882C8, #9B6AAF)"
              : th.accentBgSubtle,
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

function AskCoachCard({ canUseAI, aiUsesLeft, isPremium, trackAIUse, onUpgrade, th }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const LOCAL_ANSWERS = [
    "That's worth sitting with. Start with the smallest possible step — don't try to solve everything at once. Just one tiny move today in the right direction. Momentum builds from there.",
    "When things feel heavy, you don't have to figure it all out right now. Give yourself permission to take it one moment at a time. That's not weakness — it's wisdom.",
    "Try writing down exactly what's bothering you, then ask: 'What would I tell my best friend in this situation?' We're usually far kinder and wiser when advising others. Turn that compassion inward.",
    "Try the 2-minute rule: if it takes less than 2 minutes, do it now. If it's bigger, commit to just 2 minutes on it. Starting is the hardest part — and once you're in motion, it gets easier.",
    "Ask yourself: what do you actually want here — not what you think you should want? When your actions align with your real values, things start to feel less like friction and more like flow.",
    "Sometimes the best move is to stop analyzing and just act. You can always course-correct. Perfection isn't the goal — movement is. Even a small step counts.",
    "It helps to separate what you can control from what you can't. Focus all your energy on the controllable things, and practice letting the rest go. That's not giving up — that's being strategic.",
    "Be careful not to let one hard moment write the story of the whole day. Zoom out: this is one chapter, not the whole book. What's one thing you can do right now to shift the next hour?",
    "Rest is not the opposite of productivity — it's part of it. If you're running on empty, your best thinking and effort won't show up. Give yourself permission to recharge without guilt.",
    "You don't need to have a big insight or breakthrough. Just notice what's happening inside you without judging it. Awareness alone is a kind of progress.",
    "Sometimes we hold ourselves to standards we'd never apply to anyone we love. What would you say to a close friend in this exact situation? That's probably what you need to hear too.",
    "Feelings are information, not instructions. You can feel overwhelmed and still move forward. The feeling doesn't have to go away before you take the next step.",
    "What's one thing that's actually going right, even a little bit? Not to ignore the hard stuff — just to remind yourself that both things can be true at once.",
    "Growth is often invisible while it's happening. You might feel stuck, but look back even one month: something has shifted, even slightly. Keep going.",
    "You're here, asking questions, trying to understand yourself better. That alone puts you ahead of where you were. Don't discount that.",
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
          max_tokens: 600,
          system: `You are a warm, wise positivity coach inside an app called Daily Shine. Your job is to respond SPECIFICALLY to exactly what the user just asked or shared — not with generic advice.

Rules:
- READ the user's message carefully and address their SPECIFIC situation, words, and feelings directly
- Reference details from what they said (their exact problem, emotion, scenario) in your response
- Be warm and direct — like a wise, perceptive friend who actually listened, not a therapist reciting tips
- Aim for 3-5 sentences: enough to be genuinely helpful, not so long it feels like a lecture
- Give concrete, actionable advice tailored to their exact situation when appropriate
- If the conversation has multiple messages, build on what was already discussed — do not repeat yourself
- No toxic positivity — validate the hard parts before offering reframes or solutions
- If someone seems to be in crisis, warmly encourage them to reach out to a professional or trusted person
- Never diagnose or prescribe medical/psychological treatment
- Never give generic responses that could apply to anyone — every answer should feel like it was written just for this person`,
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
          color: th.textMuted, fontWeight: 600
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
              background: `linear-gradient(135deg, ${th.accentBg}, ${th.accentBgSubtle})`,
              padding: "4px 10px", borderRadius: 100,
              color: th.accent, fontWeight: 600
            }}>
              ✦ PRO
            </span>
          )}
        </div>
      </div>

      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        color: th.textMuted, marginBottom: 16, lineHeight: 1.5
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
                  ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`
                  : "rgba(255,255,255,0.7)",
                color: msg.role === "user" ? "white" : "#4A3F35",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                lineHeight: 1.5,
                borderBottomRightRadius: msg.role === "user" ? 6 : 18,
                borderBottomLeftRadius: msg.role === "coach" ? 6 : 18,
                border: msg.role === "coach" ? `1px solid ${th.cardBorder}` : "none",
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
                border: `1px solid ${th.cardBorder}`,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: th.textMuted
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
            background: th.moodBg, border: `1px solid ${th.cardBorder}`,
            borderRadius: 16, fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: "#4A3F35", outline: "none"
          }}
        />
        <button onClick={askCoach} disabled={loading || !question.trim()} style={{
          width: 48, height: 48, borderRadius: 16, border: "none", flexShrink: 0,
          background: (question.trim() && !loading)
            ? `linear-gradient(135deg, ${th.accent}, ${th.accentAlt})`
            : th.accentBgSubtle,
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
          background: `linear-gradient(135deg, ${th.accentBg}, ${th.accentBgSubtle})`,
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: th.accent, fontWeight: 500, cursor: "pointer"
        }}>
          ✦ Upgrade to Pro for unlimited AI coaching
        </button>
      )}
    </div>
  );
}
