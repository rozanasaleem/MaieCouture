import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function AboutPage() {
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
      <p className="text-xs tracking-[0.26em] uppercase text-[--muted]">
        {isArabic ? "عن الدار" : "About the house"}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl text-[--ink] sm:text-6xl">
        {isArabic
          ? "مي سلامة"
          : "Maie Salameh"}
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <p className="text-sm leading-8 text-[--muted]">
          {isArabic
            ? "ماي سلامة هي مصممة أزياء فلسطينية وُلدت وترعرعت في رام الله، فلسطين. درست علم النفس في جامعة بيرزيت، ثم اختارت أن تصنع مسارها في تصميم الأزياء. بجذورٍ تعود إلى يالو قرب الرملة، وهي بلدة هُجّرت ودُمّرت خلال احتلال 1948، ترتبط ماي بهويتها الفلسطينية ارتباطاً عميقاً."
            : "Maie Salameh is a Palestinian fashion designer born and raised in Ramallah, Palestine. She pursued her bachelor’s degree in Psychology at Birzeit University. After graduating, Maie decided to forge her path in fashion design. With roots in Yalo, a small town near Al Ramla that was annexed and destroyed during the 1948 occupation, Maie is deeply connected to her Palestinian identity."}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {isArabic
            ? "Maie Couture هي امتداد لهذا الإرث؛ إذ تستكشف التطريز الفلسطيني بأنواعه اليدوية والآلية، وتدمج نقوشاً من مناطق فلسطينية مختلفة، لكل منها حكاية خاصة تحفظ الذاكرة الثقافية. تصاميمها تمزج بين أصالة التطريز الفلسطيني والموضة المعاصرة لتقديم قطعٍ خالدة وحديثة في آنٍ واحد."
            : "Maie Couture is a testament to her heritage, exploring various types of embroidery, both handmade and machine-produced. She incorporates designs and patterns from different regions of Palestine, each telling a unique story and preserving cultural heritage. Her creations blend the rich tradition of Palestinian embroidery with contemporary fashion, creating pieces that are both timeless and modern."}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {isArabic
            ? "خلال فترة قصيرة، حققت ماي حضوراً لافتاً من خلال مجموعات عديدة، من بينها مجموعة Jafra، وأسست ثلاثة فروع في رام الله. كما تدير مشغلها الخاص وتتعاون مع نساء فلسطينيات لتحويل التصاميم إلى قطع حيّة، في مساحة تجمع بين الإبداع والتمكين والحفاظ على الحرفة."
            : "In a short period, Maie has gained significant recognition for her work. She has created numerous collections, including the acclaimed Jafra collection, and has established three branches across Ramallah. Maie also runs her own workshop, where she collaborates with Palestinian women to bring her unique designs to life. Her workshop is a hub of creativity and empowerment, fostering a community of artisans dedicated to preserving and innovating traditional Palestinian fashion."}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {isArabic
            ? "من خلال تصاميمها، تصل ماي سلامة الماضي الفلسطيني بالموضة المعاصرة، لتقدّم بياناً بصرياً قوياً عن الهوية والصمود."
            : "Through her designs, Maie Salameh connects the Palestinian past to contemporary fashion, making a powerful statement of identity and resilience."}
        </p>
      </div>
    </div>
  );
}
