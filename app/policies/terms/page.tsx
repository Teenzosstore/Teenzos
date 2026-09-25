import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Terms & Conditions | Teenzosstore',
}

export default function TermsConditions() {
  return (
    <main className="overflow-x-hidden pt-[108px] md:pt-[120px] bg-cream min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 md:py-24">
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-emerald prose-sm md:prose-base text-ink/80 max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          
          <p>
            Welcome to Teenzosstore. By accessing or using our website, you agree to be bound by these Terms and Conditions and our Privacy Policy.
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">1. Online Store Terms</h3>
          <p>
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose.
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">2. Products or Services</h3>
          <p>
            Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products.
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">3. Accuracy of Billing and Account Information</h3>
          <p>
            We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. 
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">4. Payment Terms</h3>
          <p>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue any product or service without notice.
          </p>

          <h3 className="font-display font-semibold text-xl text-ink mt-8 mb-4">5. Contact Information</h3>
          <p>
            Questions about the Terms and Conditions should be directed to us at:
          </p>
          <ul className="list-none pl-0 space-y-2 text-ink/80">
            <li><strong>Brand Name:</strong> Teenzosstore</li>
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
