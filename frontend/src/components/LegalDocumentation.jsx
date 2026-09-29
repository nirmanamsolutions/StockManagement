import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  FileTextIcon,
  LockIcon,
  ReceiptIcon,
  AlertTriangleIcon,
  DatabaseIcon,
  PrinterIcon,
  SearchIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingIcon,
  ScaleIcon,
  AwardIcon,
  SparklesIcon,
  DownloadIcon
} from 'lucide-react';

export default function LegalDocumentation({ lang = 'mr', onBack, fullScreen = false }) {
  const [activePolicy, setActivePolicy] = useState('terms');
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveDate = '२९ सप्टेंबर २०२६';
  const entityName = 'शिवरत्न किराणा & जनरल स्टोअर्स / निर्माम सोल्युशन्स';
  const shopLocation = 'खंडोबाचीवाडी, सातारा जिल्हा, महाराष्ट्र — ४१५००१';
  const grievanceOfficer = 'दुकान व्यवस्थापक / तक्रार निवारण अधिकारी';
  const contactPhone = '९७६३९५०७९७';

  const handlePrint = () => {
    window.print();
  };

  const policies = [
    {
      id: 'terms',
      titleEn: 'सेवा व नियम',
      titleMr: 'सेवा व नियम',
      subtitleEn: 'वापराचे नियम, ॲडमिन हक्क व दुकानाचे अटी',
      subtitleMr: 'वापराचे नियम, ॲडमिन हक्क व दुकानाचे अटी',
      icon: ScaleIcon,
      color: '#4338ca',
      bg: '#eef2ff'
    },
    {
      id: 'privacy',
      titleEn: 'गोपनीयता व डेटा सुरक्षा',
      titleMr: 'गोपनीयता व डेटा सुरक्षा',
      subtitleEn: 'डेटा गोपनीयता व ग्राहकांच्या अधिकारांचे रक्षण',
      subtitleMr: 'डेटा गोपनीयता व ग्राहकांच्या अधिकारांचे रक्षण',
      icon: LockIcon,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      id: 'refund',
      titleEn: 'बिलिंग व परतावा धोरण',
      titleMr: 'बिलिंग व परतावा धोरण',
      subtitleEn: 'काऊंटर बिलं, माल परतावा व ऑनलाईन पेमेंट अटी',
      subtitleMr: 'काऊंटर बिलं, माल परतावा व ऑनलाईन पेमेंट अटी',
      icon: ReceiptIcon,
      color: '#d97706',
      bg: '#fffbe6'
    },
    {
      id: 'disclaimer',
      titleEn: 'कायदेशीर अस्वीकरण',
      titleMr: 'कायदेशीर अस्वीकरण',
      subtitleEn: 'टॅक्स/सीए अस्वीकरण व सिस्टीम मर्यादा',
      subtitleMr: 'टॅक्स/सीए अस्वीकरण व सिस्टीम मर्यादा',
      icon: AlertTriangleIcon,
      color: '#dc2626',
      bg: '#fef2f2'
    },
    {
      id: 'cookie',
      titleEn: 'डेटा साठवणूक व कुकी धोरण',
      titleMr: 'डेटा साठवणूक व कुकी धोरण',
      subtitleEn: 'ब्राऊझर लोकल स्टोरेज व सेशन माहिती',
      subtitleMr: 'ब्राऊझर लोकल स्टोरेज व सेशन माहिती',
      icon: DatabaseIcon,
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    {
      id: 'acceptable',
      titleEn: 'सुरक्षा व गैरवापर नियम',
      titleMr: 'सुरक्षा व गैरवापर नियम',
      subtitleEn: 'ॲडमिन पॅनेल सुरक्षा व डेटा गैरवापर नियम',
      subtitleMr: 'ॲडमिन पॅनेल सुरक्षा व डेटा गैरवापर नियम',
      icon: ShieldCheckIcon,
      color: '#7c3aed',
      bg: '#f5f3ff'
    }
  ];

  const filteredPolicies = policies.filter(p =>
    p.titleMr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.subtitleMr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMarathiContent = () => {
    switch (activePolicy) {
      case 'terms':
        return (
          <div className="legal-section">
            <div className="executive-summary-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4338ca', fontWeight: 800, marginBottom: '0.35rem' }}>
                <SparklesIcon size={18} />
                <span>थोडक्यात महत्त्वाची माहिती</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                हे सॉफ्टवेअर वापरताना युझरने लॉगइन माहिती गुप्त ठेवावी, ग्राहकांच्या उधारीची नोंद अचूक ठेवावी आणि सॉफ्टवेअरचे सर्व कॉपीराईट हक्क शिवरत्न किराणा & निर्माम सोल्यूशन्सकडे सुरक्षित आहेत हे मान्य करावे.
              </p>
            </div>

            <h3>१. सेवा व अटी करार</h3>
            <p className="legal-meta">लागू दिनांक: {effectiveDate} | नियम: गोपनीयता व माहिती तंत्रज्ञान कायदा सुसंगत</p>

            <p>
              <strong>{entityName}</strong> च्या स्टॉक व्यवस्थापन, पॉईंट ऑफ सेल बिलिंग आणि ग्राहक उधारी खातं प्रणालीमध्ये आपले स्वागत आहे.
              या ॲप्लिकेशनचा वापर करून आपण खालील सर्व कायदेशीर अटी व शर्तींशी सहमत आहात.
            </p>

            <h4>१.१ ॲप्लिकेशनचा उद्देश व स्वरूप</h4>
            <p>
              हे सॉफ्टवेअर दुकानातील मालाचा साठा, ग्राहकांची उधारी, विक्रीची बिलं बनवणे आणि छापील पावती तयार करणे यासाठी डिझाइन केलेले आहे.
            </p>

            <h4>१.२ युझरच्या जबाबदाऱ्या व सुरक्षा</h4>
            <ul>
              <li>ॲडमिन लॉगइन क्रेडेंशियल (युझरनेम व पासवर्ड) गुप्त ठेवणे ही पूर्णपणे युझरची जबाबदारी आहे.</li>
              <li>दुकानातील मालाचे भाव, प्रमाण आणि ग्राहकांची माहिती अचूक नोंदवण्याची जबाबदारी युझरची आहे.</li>
              <li>ॲडमिन अकाऊंटवरून झालेल्या प्रत्येक व्यवहारास नोंदणीकृत युझर जबाबदार असेल.</li>
            </ul>

            <h4>१.३ बौद्धिक संपदा अधिकार</h4>
            <p>
              या ॲप्लिकेशनचे कोडिंग, डिझाइन, लोगो, डेटाबेस स्ट्रक्चर आणि सर्व हक्क <strong>निर्माम सोल्युशन्स</strong> व <strong>शिवरत्न किराणा & जनरल स्टोअर्स</strong> कडे सुरक्षित आहेत.
              ॲप्लिकेशनची अनधिकृत कॉपी, फेरफार किंवा पुनर्विक्री करण्यास कायद्याने सक्त मनाई आहे.
            </p>

            <h4>१.४ कायदेशीर अधिकारक्षेत्र</h4>
            <p>
              या अटी व शर्ती भारतीय कायद्यानुसार संचलित केल्या जातात. कोणत्याही कायदेशीर वादाच्या प्रसंगी अधिकारक्षेत्र सातारा / पुणे, महाराष्ट्र, भारत येथील सक्षम न्यायालयांच्या अधीन राहील.
            </p>
          </div>
        );

      case 'privacy':
        return (
          <div className="legal-section">
            <div className="executive-summary-box success-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 800, marginBottom: '0.35rem' }}>
                <CheckCircle2Icon size={18} />
                <span>डिजिटल गोपनीयता कायदा डेटा सुरक्षा हमी</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                ग्राहकांचे नाव, मोबाईल नंबर व उधारीची माहिती फक्त दुकानाच्या बिलासाठी आणि हिशोबासाठीच वापरली जाते. आम्ही कोणत्याही तिसऱ्या पक्षाला किंवा जाहिरातदारांना डेटा विकत नाही.
              </p>
            </div>

            <h3>२. गोपनीयता व डेटा सुरक्षा धोरण</h3>
            <p className="legal-meta">माहिती तंत्रज्ञान कायदा २००० व डिजिटल पर्सनल डेटा प्रोटेक्शन कायदा २०२३ सुसंगत</p>

            <p>
              <strong>{entityName}</strong> ग्राहकांच्या आणि दुकानाच्या डेटा गोपनीयतेला सर्वोच्च प्राधान्य देते. आम्ही डेटा कसा साठवतो व सुरक्षित ठेवतो याचा सविस्तर तपशील खालीलप्रमाणे आहे.
            </p>

            <h4>२.१ आम्ही जमा करत असलेली माहिती</h4>
            <ul>
              <li><strong>ग्राहक माहिती:</strong> ग्राहकाचे नाव, मोबाईल नंबर, आणि उधारी खात्याची नोंद.</li>
              <li><strong>साठा व माल माहिती:</strong> वस्तूंचे नाव, खरेदी दर, विक्री दर, उपलब्ध प्रमाण.</li>
              <li><strong>व्यवहार इतिहास:</strong> बिलांचे क्रमांक, जोडलेल्या वस्तू, पेमेंट पद्धत (रोख / युपीआय / उधारी) आणि वेळ.</li>
              <li><strong>ब्राऊजर माहिती:</strong> भाषेची निवड आणि लॉगइन स्थिती.</li>
            </ul>

            <h4>२.२ माहितीचा वापर व उद्देश</h4>
            <p>आम्ही जमा केलेल्या माहितीचा वापर फक्त खालील दुकानाच्या कामांसाठी करतो:</p>
            <ul>
              <li>ग्राहकांना अचूक डिजिटल व छापील पावती बिल देणे.</li>
              <li>ग्राहकांच्या उधारी खात्याचा हिशोब ठेवणे व जमा-बाकी दाखवणे.</li>
              <li>ग्राहकांना उधारीच्या वसुलीसाठी व्हाट्सॲप मेसेज पाठवणे.</li>
              <li>दुकानातील संपत आलेल्या मालाचे वॉर्निंग ॲलर्ट देणे.</li>
            </ul>

            <h4>२.३ डेटा सुरक्षा व गोपनीयता</h4>
            <p>
              सर्व डेटा सुरक्षित एन्क्रिप्शनद्वारे प्रोसेस केला जातो.
              आम्ही कोणत्याही ग्राहकाचा किंवा दुकानाचा डेटा कोणत्याही तिसऱ्या पक्षाला किंवा जाहिरातदारांना विकत नाही किंवा शेअर करत नाही.
            </p>

            <h4>२.४ ग्राहकांचे कायदेशीर अधिकार</h4>
            <ul>
              <li>ग्राहक स्वतःच्या उधारी व व्यवहाराची माहिती पाहू शकतात.</li>
              <li>चुकीची नोंद दुरुस्त करण्याची विनंती करू शकतात.</li>
              <li>उधारी पूर्ण भरल्यानंतर खाते रद्द किंवा अपडेट करण्याची मागणी करू शकतात.</li>
            </ul>

            <h4>२.५ तक्रार निवारण अधिकारी</h4>
            <div className="contact-box">
              <p><strong>तक्रार अधिकारी:</strong> {grievanceOfficer}</p>
              <p><strong>संस्था/दुकान:</strong> {entityName}</p>
              <p><strong>पत्ता:</strong> {shopLocation}</p>
            </div>
          </div>
        );

      case 'refund':
        return (
          <div className="legal-section">
            <div className="executive-summary-box warning-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, marginBottom: '0.35rem' }}>
                <ReceiptIcon size={18} />
                <span>पावती व माल परतावा नियम</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                तयार केलेले बिल थेट खरेदी दर्शवते. दुकानदाराने स्वीकारलेला परत आलेला माल ग्राहकाच्या उधारी खात्यात वजा केला जाईल किंवा रोख रक्कम दिली जाईल.
              </p>
            </div>

            <h3>३. बिलिंग व परतावा धोरण</h3>
            <p className="legal-meta">लागू दिनांक: {effectiveDate}</p>

            <p>
              हे धोरण <strong>{entityName}</strong> द्वारे तयार केलेल्या बिलांना आणि वस्तूंच्या परताव्याच्या नियमांना लागू होते.
            </p>

            <h4>३.१ काउंटर विक्री बिलं</h4>
            <p>
              दुकानात तयार केलेले प्रत्येक बिल हे थेट खरेदीचे प्रतीक आहे. ग्राहकांना मालाचे दर, प्रमाण आणि एकूण रक्कमेची पावती दिली जाते.
            </p>

            <h4>३.२ वस्तूंचा परतावा व जमा-उधारी ॲडजस्टमेंट</h4>
            <ul>
              <li>खराब किंवा चुकीचा माल परत घेण्याचे नियम शिवरत्न किराणा & जनरल स्टोअर्सच्या दुकानातील धोरणानुसार ठरतील.</li>
              <li>माल परत घेतल्यास दुकानातून बिलाची रक्कम रोख परत केली जाईल किंवा ग्राहकाच्या उधारी खात्यात ती रक्कम वजा केली जाईल.</li>
            </ul>

            <h4>३.३ ऑनलाईन व युपीआय पेमेंट</h4>
            <p>
              गूगल पे, फोनपे किंवा कार्डद्वारे केलेले पेमेंट हे बँक व युपीआय नेटवर्कद्वारे होते. पेमेंट यशस्वी झाल्याची नोंद ॲप्लिकेशनमध्ये केली जाते.
            </p>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="legal-section">
            <div className="executive-summary-box danger-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', fontWeight: 800, marginBottom: '0.35rem' }}>
                <AlertTriangleIcon size={18} />
                <span>टॅक्स व सी.ए. अस्वीकरण</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                हे सिस्टीम दुकानातील हिशोब सोपा करण्यासाठी आहे. अधिकृत टॅक्स किंवा जीएसटी रिटर्न भरण्यासाठी अधिकृत चार्टर्ड अकाउंटंटचा सल्ला घ्यावा.
              </p>
            </div>

            <h3>४. कायदेशीर अस्वीकरण व दायित्व मर्यादा</h3>
            <p className="legal-meta">आर्थिक व कायदेशीर अस्वीकरण</p>

            <h4>४.१ सी.ए. / कर सल्लागार पर्याय नाही</h4>
            <p>
              <strong>{entityName}</strong> हे दुकानातील हिशोब आणि बिलांसाठी बनवलेले सोपे सॉफ्टवेअर आहे.
              हे अधिकृत जीएसटी किंवा इन्कम टॅक्स रिटर्न ऑडिट सिस्टीम नाही. अधिकृत टॅक्स रिटर्नसाठी चार्टर्ड अकाउंटंट किंवा टॅक्स सल्लागाराचा सल्ला घ्यावा.
            </p>

            <h4>४.२ सर्व्हिस उपलब्धतेचे अस्वीकरण</h4>
            <p>
              हे सॉफ्टवेअर जसे आहे तसे तत्त्वावर उपलब्ध करून दिले जाते. इंटरनेट नेटवर्क बंद पडल्यास किंवा डिव्हाइस खराब झाल्यास होणाऱ्या विलंबासाठी ॲप्लिकेशन जबाबदार नसेल.
            </p>

            <h4>४.३ दायित्व मर्यादा</h4>
            <p>
              कोणत्याही अप्रत्यक्ष किंवा व्यावसायिक नुकसानीस शिवरत्न किराणा, निर्माम सोल्यूशन्स किंवा त्याचे डेव्हलपर्स कायदेशीररीत्या जबाबदार असणार नाहीत.
            </p>
          </div>
        );

      case 'cookie':
        return (
          <div className="legal-section">
            <h3>५. डेटा साठवणूक व कुकी धोरण</h3>
            <p className="legal-meta">ब्राऊझर डेटा व सेव्ह केलेली माहिती</p>

            <p>
              हे ॲप्लिकेशन वापरताना युझरचा अनुभव जलद आणि सोपा व्हावा यासाठी ब्राऊझरमधील <code>localStorage</code> चा वापर केला जातो.
            </p>

            <table className="legal-table">
              <thead>
                <tr>
                  <th>माहितीचे नाव</th>
                  <th>उद्देश</th>
                  <th>कालावधी</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>kirana_admin_auth</code></td>
                  <td>लॉगइन स्थिती सुरक्षित ठेवण्यासाठी</td>
                  <td>लॉगआउट करेपर्यंत</td>
                </tr>
                <tr>
                  <td><code>kirana_lang</code></td>
                  <td>निवडलेली भाषा लक्षात ठेवण्यासाठी</td>
                  <td>कायमस्वरूपी</td>
                </tr>
                <tr>
                  <td><code>kirana_active_tab</code></td>
                  <td>चालू असणारे पेज लक्षात ठेवण्यासाठी</td>
                  <td>सेशन संपेपर्यंत</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'acceptable':
        return (
          <div className="legal-section">
            <h3>६. योग्य वापर व सुरक्षा नियम</h3>
            <p className="legal-meta">सुरक्षा व गैरवापर प्रतिबंध नियम</p>

            <p>सिस्टीमची सुरक्षा अबाधित ठेवण्यासाठी सर्व वापरकर्त्यांनी खालील नियमांचे पालन करणे बंधनकारक आहे:</p>

            <ul>
              <li>ॲडमिन पॅनेलमध्ये अनधिकृत प्रवेश करण्याचा प्रयत्न करणे बेकायदेशीर आहे.</li>
              <li>ग्राहकांचे उधारीचे रेकॉर्ड किंवा बिलांचे आकडे खोटे बदलण्यास बंदी आहे.</li>
              <li>ॲप्लिकेशनच्या कोडिंगमध्ये फेरफार करणे किंवा अनधिकृत बॉट्स वापरणे निषिद्ध आहे.</li>
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      maxWidth: fullScreen ? '100%' : '1200px',
      margin: '0 auto',
      padding: fullScreen ? '1.5rem 1rem' : '0 1rem',
      color: 'var(--text-body)'
    }}>

      {/* Executive Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.8rem',
        color: '#ffffff',
        marginBottom: '1.6rem',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.45)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Background Glow Elements */}
        <div style={{
          position: 'absolute',
          top: '-40px', right: '-40px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '0.5rem 0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <ArrowLeftIcon size={16} />
                <span>मुख्य पृष्ठावर जा</span>
              </button>
            )}

            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '0.85rem',
              borderRadius: '16px',
              display: 'flex',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)'
            }}>
              <ShieldCheckIcon size={32} color="#ffffff" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <AwardIcon size={12} /> कायदेशीर व सुरक्षा प्रमाणित
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                कायदेशीर व नियम केंद्र
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: '#94a3b8', fontWeight: 500 }}>
                {entityName} • अधिकृत अटी, डेटा सुरक्षा व गोपनीयता मानके
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#ffffff',
                border: 'none',
                color: '#1e1b4b',
                padding: '0.5rem 1.05rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(255,255,255,0.25)'
              }}
            >
              <PrinterIcon size={16} />
              <span>पावती/रिपोर्ट प्रिंट करा</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Grid: Policy Sidebar & Interactive Reader */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
        gap: '1.4rem',
        alignItems: 'start'
      }} className="legal-layout-grid">

        {/* Sidebar Container */}
        <div className="card-surface" style={{ padding: '1.15rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>

          {/* Policy Search Filter Bar */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SearchIcon size={16} color="var(--text-muted)" />
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '38px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Policy Navigation List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {filteredPolicies.map((item) => {
              const Icon = item.icon;
              const isActive = activePolicy === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePolicy(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? item.color : 'transparent',
                    background: isActive ? item.bg : 'transparent',
                    color: isActive ? item.color : 'var(--text-heading)',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{
                    background: isActive ? item.color : 'var(--bg-surface-raised)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    padding: '0.4rem',
                    borderRadius: '8px',
                    display: 'flex',
                    flexShrink: 0
                  }}>
                    <Icon size={16} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ lineHeight: 1.25 }}>{item.titleMr}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitleMr}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Contact Sidebar Box */}
          <div style={{
            marginTop: '1.4rem',
            padding: '1rem',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.78rem'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BuildingIcon size={15} color="var(--primary)" />
              <span>संपर्क माहिती</span>
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
              <div><strong>शिवरत्न किराणा & जनरल स्टोअर्स</strong></div>
              <div>{shopLocation}</div>
              <div style={{ marginTop: '0.3rem', color: 'var(--primary)', fontWeight: 800 }}>मोबाईल: {contactPhone}</div>
            </div>
          </div>

        </div>

        {/* Policy Document Reader Main Section */}
        <div className="card-surface legal-content-card" style={{ padding: '2rem 2.2rem', background: '#ffffff', minHeight: '520px', borderRadius: 'var(--radius-md)' }}>
          {renderMarathiContent()}
        </div>

      </div>

    </div>
  );
}
