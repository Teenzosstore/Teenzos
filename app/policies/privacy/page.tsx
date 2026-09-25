import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Privacy Policy | Teenzosstore',
}

export default function PrivacyPolicy() {
  return (
    <main className="overflow-x-hidden pt-[108px] md:pt-[120px] bg-cream min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 md:py-24">
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink mb-8">Privacy Policy</h1>
        
        <div className="prose prose-emerald prose-sm md:prose-base text-ink/80 max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          
          <p>
            Teenzosstore ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Teenzosstore.
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">1. Information We Collect</h3>
          <p>
            When you visit our website, we collect certain information about your device, your interaction with the site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Device information:</strong> version of web browser, IP address, time zone, cookie information.</li>
            <li><strong>Order information:</strong> name, billing address, shipping address, payment information, email address, and phone number.</li>
          </ul>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">2. How We Use Your Information</h3>
          <p>We use the order information that we collect generally to fulfill any orders placed through the site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).</p>
          
          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">3. Sharing Your Personal Information</h3>
          <p>We share your Personal Information with service providers to help us provide our services and fulfill our contracts with you, as described above. For example, we use third-party logistics and communications providers.</p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">4. Contact Us</h3>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make an inquiry, please contact us:
          </p>
          <ul className="list-none pl-0 space-y-2 text-ink/80">
            <li><strong>Brand:</strong> Teenzosstore</li>
            <li><strong>Proprietor:</strong> Nabil Patni Vahora</li>
            <li><strong>Email:</strong> <a href="mailto:teenzosstore@gmail.com" className="text-pink hover:underline">teenzosstore@gmail.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:+917862907344" className="hover:underline">+91 78629 07344</a> / <a href="tel:+917622078703" className="hover:underline">+91 76220 78703</a></li>
            <li><strong>Address:</strong> First Floor B/123, Sohelpark, Fatehwadi, Gyaspur, Ahmedabad - 382405, Gujarat, India</li>
          </ul>
        </div>
      </div>

      <Footer />
    </main>
  );
}
