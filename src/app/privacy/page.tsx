import { Metadata } from "next";
import { Header } from "@/app/header";
import { Footer } from "@/app/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | MentoPanda",
  description:
    "MentoPanda's privacy policy - Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-background py-16">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <p className="text-gray-600 mb-6">Last Updated: March 20, 2024</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p className="mb-4">
            This Privacy Policy describes how Coding Ventures
            (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) collects, uses, and handles your personal data
            (&quot;Personal Data&quot;), and what choices you have when you use
            our website, applications, platforms, and services (collectively,
            the &quot;Services&quot;). By using the Services, you agree to the
            collection and use of information in accordance with this Privacy
            Policy. If you do not agree to the practices described in this
            Privacy Policy, please do not access or use the Services. Any
            capitalized terms not defined herein have the meaning ascribed to
            them in our Terms of Service.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            2. Information We Collect
          </h2>
          <p className="mb-4">
            We collect several different types of information for various
            purposes to provide and improve our Services, including Personal
            Data and Usage Data as set forth below. If you do not provide your
            information when requested, you may not be able to use some or all
            of our Services if that information is necessary to provide you with
            our Services or we are legally required to collect it.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Data</h3>
          <p className="mb-4">
            While using our Services, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you (&quot;Personal Data&quot;). Personal Data may include
            without limitation your email address, first name and last name,
            phone number, cookies, usage data as defined below, and any other
            Personal Data that you voluntarily provide to MentoPanda.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Usage Data</h3>
          <p className="mb-4">
            We may collect information related to your interaction with or usage
            of the Services, including without limitation your IP address,
            device type, browser type and version, pages of our Services that
            you visit, the time and date of your visit, the time spent on those
            pages, device language, unique device identifiers, system logs,
            performance metrics, and other diagnostic data related to your
            interaction with the Services (&quot;Usage Data&quot;). When you
            access the Services with a mobile device, Usage Data may also
            include information such as the type of mobile device, mobile device
            unique ID, mobile IP address, mobile operating system, mobile
            Internet browser type, and other diagnostic data.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.3 User Content You Provide
          </h3>
          <p className="mb-4">
            We collect User Content that you provide to us in order to use the
            Services. This may include content containing Personal Information
            that you choose to include and contextual information that you
            choose to make available. For example, if you enable optional
            features, we may collect limited, relevant content to enhance the
            accuracy of MentoPanda&apos;s outputs. This content is processed solely
            to deliver the Services, and you can opt out of this at any time
            through your settings. If you opt to share your content with us for
            service improvement, we may also collect pseudonymized text and
            corrections you provide to improve the performance of MentoPanda for
            all users. This may include Personal Information if shared.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.4 Third-Party Platforms
          </h3>
          <p className="mb-4">
            We may collect information when you connect to your account using an
            account maintained by a third party, such as a social media account
            (&quot;Third-Party Account&quot;). The Services may collect
            information about you from your Third-Party Accounts in accordance
            with your permissions. When you connect to us through a Third-Party
            Account like Facebook or Google, we receive information from that
            third party identifying your account. We collect and store this
            information and use it to help you connect to the Services.
            Connecting your account to a Third-Party Account is completely
            optional, and you will have the opportunity to grant permission when
            you attempt to connect. You can revoke permission by logging into
            the Third-Party Account and disconnecting MentoPanda from there, and
            through the native applications on your smartphone. We may retain
            the information we collected previously from you.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.5 Payment Information
          </h3>
          <p className="mb-4">
            When you sign up for any of our Paid Services, our third-party
            payment processor collects and processes your payment-related
            information, such as your name, email, billing address, credit/debit
            card or banking information, or other financial information.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.6 Other Information You Provide Directly To Us
          </h3>
          <p className="mb-4">
            You may have the option to submit additional information as you use
            our Services. For example, you may choose to participate in surveys
            where you can provide feedback on our products.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Use of Data</h2>
          <p className="mb-4">
            MentoPanda may use Personal Data and Usage Data for the following
            purposes: Service Operation to provide, update, maintain, improve,
            monitor, and protect our Services; Communication to provide customer
            and technical support, to send service-related emails, and to send
            marketing emails about new product features or other news about
            MentoPanda; Digital Advertising to display digital advertising to
            you on our website or other websites (including through the use of
            cookies or other technologies); Administration for transactional,
            billing, account management, tax, and administrative matters;
            Compliance to comply with applicable laws and regulations or a court
            or other legal order; Risk Mitigation to detect violations of our
            legal terms, enforce the legal terms that govern your use of the
            Services, or to detect, prevent, and respond to potential fraud or
            misuse of the Services; Interaction Improvement to develop and
            improve our marketing activities to better match your interests and
            preferences; Marketing to contact you with marketing or promotional
            materials and other information that may be of interest to you (you
            may opt out of receiving any, or all, of these communications from
            us by following any unsubscribe link or other mechanism provided to
            remove yourself from such communications); and for other lawful
            purposes with your consent.
          </p>

          <p className="mb-4">
            Our lawful basis to collect and use your Personal Data and Usage
            Data will depend on the type of information and the context in which
            we process it. We may process your information to enter into or
            perform a contract with you, for the purposes of our legitimate
            interests (unless your rights and freedoms override those
            interests), with your consent, or to comply with our legal
            obligations (e.g. to comply with applicable laws and regulations or
            a court or other legal order).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            4. Use of Cookies and Other Tracking Technologies
          </h2>
          <p className="mb-4">
            MentoPanda, and the third parties we work with, use cookies and
            other tracking technologies on the Services to collect information
            about your usage of the Services and your device.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            5. Online Analytics and Tailored Advertising
          </h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Analytics</h3>
          <p className="mb-4">
            We may use third-party web analytics services on the Services, such
            as those of Google Analytics. These vendors use the sort of
            technology described in the &quot;Information Collection and Use&quot;
            section above to help us analyze how users use the Services, including
            by noting the third-party website from which you arrive. The
            information collected by such technology will be disclosed to or
            collected directly by these vendors, who use the information to
            evaluate your use of the Services. We also may use Google Analytics
            for certain purposes related to advertising. To prevent Google
            Analytics from using your information for web analytics, you may
            install the Google Analytics Opt-Out Browser Add-on.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.2 Tailored Advertising
          </h3>
          <p className="mb-4">
            We engage in advertising for our own products and services and track
            ad attributions to measure effectiveness. We may use cookies or
            similar technologies to collect information about your use of our
            Services to optimize and serve our marketing content based on your
            interactions with our website and Services. We do not sell your data
            or use it to optimize ads for other companies. Currently, we do not
            allow unaffiliated parties to serve tailored marketing through our
            Services. However, you may still receive our advertising content,
            which may not always be personalized to your interests. If you wish
            to learn more about controlling cookies for marketing purposes, you
            can visit the Network Advertising Initiative&apos;s (NAI) Consumer
            Opt-Out Link or the Digital Advertising Alliance&apos;s (DAA)
            Consumer Opt-Out Link.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            6. Data Retention
          </h2>
          <p className="mb-4">
            We will retain your Personal Data only for as long as is necessary
            for the purposes set out in this Privacy Policy. We will retain and
            use your Personal Data to the extent necessary to comply with our
            legal obligations (for example, if we are required to retain your
            data to comply with applicable laws), resolve disputes, and enforce
            our legal agreements and policies. When we no longer need to use
            your Personal Data, we will remove it from our systems or anonymize
            it so that it can no longer be associated with you. When we
            anonymize, aggregate, or de-identify Personal Data, we may use and
            disclose it for any business purpose. We will also retain Usage Data
            for internal analysis purposes. Usage Data is generally retained for
            a shorter period, except when this data is used to strengthen the
            security or to improve the functionality of our Services, or we are
            legally obligated to retain this data for longer time periods.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            7. Transfer of Data
          </h2>
          <p className="mb-4">
            Your information, including Personal Data, may be transferred to –
            and maintained on – computers located outside of your state,
            province, country or other governmental jurisdiction where the data
            protection laws may differ from those of your jurisdiction. If you
            are located outside the United States and choose to provide
            information to us, please note that we transfer the data, including
            Personal Data, to the United States and process it there. Your
            consent to this Privacy Policy followed by your submission of such
            information represents your agreement to that transfer. MentoPanda
            will take steps reasonably necessary to ensure that your data is
            treated securely and in accordance with this Privacy Policy and no
            transfer of your Personal Data will take place to an organization or
            a country unless there are adequate controls in place including the
            security of your data and other personal information.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            8. Sharing With Others
          </h2>
          <p className="mb-4">
            This section describes when we may disclose Personal Data: We may
            disclose Personal Data with Services Providers who are working on
            our behalf (e.g. billing and payment service providers, third-party
            service providers, analytics providers, cloud providers,
            communications providers). We may share your data with third-party
            services in order to provide certain features. Your data is never
            used to train these services and will be deleted after 30 days. If a
            customer of MentoPanda (e.g. your employer) has given you access to
            the Services, we may disclose certain information about you (e.g.
            your account or device information) with that Customer to satisfy
            our contractual obligations and for the purposes otherwise described
            herein. We may disclose your information to protect the rights,
            property, or personal safety of MentoPanda, its agents and
            affiliates, its users, and the public. This includes exchanging
            information with other companies and organizations for fraud
            protection, spam/malware prevention, and similar purposes. We may
            also disclose your Personal Data if we believe that disclosure is
            reasonably necessary to comply with any applicable law or
            regulation, if we are required by law to comply with any court order
            or legal process or respond to any government or regulatory request,
            and to maintain and enforce our agreements and policies. We may
            disclose your Personal Data in connection with any merger, sale of
            company assets, financing, or acquisition of all or a portion of our
            business to another company, in reliance on our legitimate business
            interests. We may disclose Personal Data with our affiliates who use
            Personal Data as set out in this Privacy Policy. We may partner with
            third party advertising networks, exchanges, and social media
            platforms to display advertising on our Services or to manage and
            service advertising on other sites, and we may disclose or otherwise
            make available Personal Data with them for this purpose. We may
            share your Personal Data with other third parties with your express
            consent.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            9. How We Secure Your Information
          </h2>
          <p className="mb-4">
            The security of your data is important to us. We implement
            technical, administrative and physical safeguards to protect the
            information we collect from loss, misuse and unauthorized access,
            disclosure, alteration, or destruction. However, no method of
            transmission over the internet or method of electronic storage is
            100% secure. While we strive to use commercially acceptable means to
            protect your Personal Data, we cannot guarantee its absolute
            security.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            10. Your Data Protection Rights
          </h2>
          <p className="mb-4">
            If you are a resident of the European Union (EU) and European
            Economic Area (EEA), you have certain data protection rights,
            covered by GDPR. We aim to take reasonable steps to allow you to
            correct, amend, delete, or limit the use of your Personal Data. If
            you wish to be informed what Personal Data we hold about you and if
            you want it to be removed from our systems, please email us at
            privacy@codingventures.com.
          </p>

          <p className="mb-4">
            In certain circumstances, you have the following data protection
            rights: to access, update or delete the information we have on you;
            to have your information rectified if that information is inaccurate
            or incomplete; to object to our processing of your Personal Data; to
            request that we restrict the processing of your personal
            information; to be provided with a copy of your Personal Data in a
            structured, machine-readable and commonly used format; and to
            withdraw your consent at any time where we rely on your consent to
            process your personal information. Please note that we may ask you
            to verify your identity before responding to such requests. Please
            note, we may not be able to provide Services without some necessary
            data. You have the right to complain to a Data Protection Authority
            about our collection and use of your Personal Data.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            11. Children&apos;s Personal Data
          </h2>
          <p className="mb-4">
            To use the Services, you must be at least 13 if you reside in the
            United States, and 16 if you reside anywhere else. If you are under
            the age of 18, depending on where you live, you may need to have
            your parent or guardian&apos;s consent to these Terms and they may
            need to enter into these Terms on your behalf. If you are a parent
            or guardian and become aware that your child provided us with
            Personal Data, you should contact us at privacy@codingventures.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            12. Services Providers
          </h2>
          <p className="mb-4">
            We may use third-party companies, vendors, personnel and other
            service providers to facilitate our Services, provide Services on
            our behalf, analyze how our Services are used, and provide similar
            third-party services (collectively, &quot;Services Providers&quot;).
            These Services Providers may have access to your Personal Data only
            to perform these tasks on our behalf and are obligated not to
            disclose or use it for any other purpose.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            13. Links to Third-Party Websites
          </h2>
          <p className="mb-4">
            The Services may contain links to third-party websites or services.
            We are not responsible for the content or practices of those
            websites or services. The collection, use, and disclosure of your
            information by third parties will be subject to the privacy policies
            of the third-party websites or services, and not this Policy. We
            urge you to read the privacy and security policies of these third
            parties before providing information to them.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            14. Changes to This Privacy Policy
          </h2>
          <p className="mb-4">
            We&apos;ll update this Privacy Policy from time to time. When we
            make changes, we&apos;ll update the date at the top of the Privacy
            Policy. If a modification meaningfully reduces your rights, we will
            notify you (by, for example, sending you an email or displaying a
            prominent notice within the Services). The notice may designate a
            reasonable period after which the new terms will take effect.
            Modifications will not apply retroactively. We encourage you to
            check back periodically to review this Privacy Policy for any
            changes since periodically to review this Privacy Policy for any
            changes since your last visit. This will help ensure you better
            understand your relationship with us, including the ways we process
            your Personal Data.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact
            us by email at privacy@codingventures.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            16. Privacy Notice for California Residents
          </h2>
          <p className="mb-4">
            If you are a California resident, please be aware that under the
            California Consumer Privacy Act (CCPA), you have certain additional
            rights regarding your personal information. These include the right
            to know what personal information we collect, how we use it, and to
            whom we disclose it; the right to request deletion of your personal
            information; the right to correct inaccurate personal information;
            and the right to opt-out of the sale or sharing of personal
            information, if applicable. To exercise these rights, please contact
            us through the information provided in the Contact Us section. We
            will not discriminate against you for exercising any of these
            rights.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
