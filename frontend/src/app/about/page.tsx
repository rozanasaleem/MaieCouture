import { getLocaleFromCookies } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-shared";

export default async function AboutPage() {
  const locale = await getLocaleFromCookies();
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
      <p className="text-xs tracking-[0.26em] uppercase text-[--muted]">
        {t(locale, { en: "About the house", ar: "عن الدار", es: "Sobre la casa" })}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl text-[--ink] sm:text-6xl">
        {t(locale, { en: "Maie Salameh", ar: "مي سلامة", es: "Maie Salameh" })}
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <p className="text-sm leading-8 text-[--muted]">
          {t(locale, {
            en: "Maie Salameh is a Palestinian fashion designer born and raised in Ramallah, Palestine. She pursued her bachelor’s degree in Psychology at Birzeit University. After graduating, Maie decided to forge her path in fashion design. With roots in Yalo, a small town near Al Ramla that was annexed and destroyed during the 1948 occupation, Maie is deeply connected to her Palestinian identity.",
            ar: "ماي سلامة هي مصممة أزياء فلسطينية وُلدت وترعرعت في رام الله، فلسطين. درست علم النفس في جامعة بيرزيت، ثم اختارت أن تصنع مسارها في تصميم الأزياء. بجذورٍ تعود إلى يالو قرب الرملة، وهي بلدة هُجّرت ودُمّرت خلال احتلال 1948، ترتبط ماي بهويتها الفلسطينية ارتباطاً عميقاً.",
            es: "Maie Salameh es una disenadora de moda palestina nacida y criada en Ramala, Palestina. Estudio Psicologia en la Universidad de Birzeit y, tras graduarse, decidio forjar su propio camino en el diseno de moda. Con raices en Yalo, un pequeno pueblo cerca de Al Ramla que fue anexado y destruido durante la ocupacion de 1948, Maie mantiene una profunda conexion con su identidad palestina.",
          })}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {t(locale, {
            en: "Maie Couture is a testament to her heritage, exploring various types of embroidery, both handmade and machine-produced. She incorporates designs and patterns from different regions of Palestine, each telling a unique story and preserving cultural heritage. Her creations blend the rich tradition of Palestinian embroidery with contemporary fashion, creating pieces that are both timeless and modern.",
            ar: "Maie Couture هي امتداد لهذا الإرث؛ إذ تستكشف التطريز الفلسطيني بأنواعه اليدوية والآلية، وتدمج نقوشاً من مناطق فلسطينية مختلفة، لكل منها حكاية خاصة تحفظ الذاكرة الثقافية. تصاميمها تمزج بين أصالة التطريز الفلسطيني والموضة المعاصرة لتقديم قطعٍ خالدة وحديثة في آنٍ واحد.",
            es: "Maie Couture es una expresion de su herencia: explora distintas formas de bordado palestino, tanto artesanal como mecanico, e incorpora motivos de diferentes regiones de Palestina, cada uno con una historia propia que preserva la memoria cultural. Sus creaciones combinan la riqueza del bordado palestino con la moda contemporanea para dar vida a piezas atemporales y modernas.",
          })}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {t(locale, {
            en: "In a short period, Maie has gained significant recognition for her work. She has created numerous collections, including the acclaimed Jafra collection, and has established three branches across Ramallah. Maie also runs her own workshop, where she collaborates with Palestinian women to bring her unique designs to life. Her workshop is a hub of creativity and empowerment, fostering a community of artisans dedicated to preserving and innovating traditional Palestinian fashion.",
            ar: "خلال فترة قصيرة، حققت ماي حضوراً لافتاً من خلال مجموعات عديدة، من بينها مجموعة Jafra، وأسست ثلاثة فروع في رام الله. كما تدير مشغلها الخاص وتتعاون مع نساء فلسطينيات لتحويل التصاميم إلى قطع حيّة، في مساحة تجمع بين الإبداع والتمكين والحفاظ على الحرفة.",
            es: "En poco tiempo, Maie ha obtenido un notable reconocimiento por su trabajo. Ha creado numerosas colecciones, incluida la aclamada coleccion Jafra, y ha establecido tres sucursales en Ramala. Tambien dirige su propio taller, donde colabora con mujeres palestinas para dar vida a sus disenos. Su taller es un espacio de creatividad y empoderamiento dedicado a preservar e innovar la moda tradicional palestina.",
          })}
        </p>
        <p className="text-sm leading-8 text-[--muted]">
          {t(locale, {
            en: "Through her designs, Maie Salameh connects the Palestinian past to contemporary fashion, making a powerful statement of identity and resilience.",
            ar: "من خلال تصاميمها، تصل ماي سلامة الماضي الفلسطيني بالموضة المعاصرة، لتقدّم بياناً بصرياً قوياً عن الهوية والصمود.",
            es: "A traves de sus disenos, Maie Salameh conecta el pasado palestino con la moda contemporanea y crea una poderosa declaracion visual de identidad y resiliencia.",
          })}
        </p>
      </div>
    </div>
  );
}
