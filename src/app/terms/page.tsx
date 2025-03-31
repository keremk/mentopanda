import { Metadata } from "next";
import { Header } from "@/app/header";
import { Footer } from "@/app/footer";

export const metadata: Metadata = {
  title: "Terms of Service | MentoPanda",
  description:
    "MentoPanda's terms of service - Learn about the terms governing your use of our platform.",
};

export default function TermsOfServicePage() {
  return (
    <main className="bg-background py-16">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <p className="text-gray-600 mb-6">Last Updated: March 20, 2024</p>

        <div className="prose prose-slate max-w-none">
          <p className="mb-4">
            Welcome to MentoPanda! Coding Ventures (&quot;Coding Ventures&quot;,
            &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides
            software, including MentoPanda, to help users improve their
            management and leadership skills (collectively,
            &quot;Services&quot;). These Terms of Service (&quot;Terms&quot;)
            are entered into by and between Coding Ventures and the individual
            or entity accepting these Terms (&quot;Customer&quot;,
            &quot;you&quot;, or &quot;your&quot;), governing your access to and
            use of the Services. By using or accessing the Services, you are
            agreeing to these Terms and our Privacy Policy, which explains how
            we collect and use your information.
          </p>

          <p className="mb-4">
            To use the Services, you must be at least 13 if you reside in the
            United States, and 16 if you reside anywhere else. If you are under
            the age of 18, depending on where you live, you may need to have
            your parent or guardian&apos;s consent to these Terms and they may
            need to enter into these Terms on your behalf.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Your Account</h2>
          <p className="mb-4">
            To use the Services, you must create an account. You agree to
            provide us with accurate, complete and at all times up to date
            information for your account. We may need to use this information to
            contact you. You are responsible for maintaining the confidentiality
            of your account and password, including but not limited to the
            restriction of access to your computer and/or account. Do not share
            your account credentials or give others access to your account. You
            agree to immediately notify us if you know or have any reason to
            suspect that your account has been compromised.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Your Content</h2>
          <p className="mb-4">
            All your content remains yours; Coding Ventures does not own it.
            However, in order to provide the Services to you, we need your
            license and permission to do so. Accordingly, when you submit
            content to the Services, you grant Coding Ventures, and any
            third-party services acting on Coding Ventures&apos; behalf, a
            worldwide, non-exclusive, royalty-free, sublicensable license to
            access, reproduce, modify, distribute, transmit, export, display,
            store and otherwise use your content for the limited purpose of
            providing, improving, and protecting the Services. If we use your
            content in the ways described in these Terms, you represent and
            warrant that such use will not infringe or violate any laws or the
            rights of any third party, including without limitation any
            copyrights, trademarks, privacy rights, publicity rights, contract
            rights, trade secrets or any other intellectual property or
            proprietary rights.
          </p>

          <p className="mb-4">
            The Services use large language models (LLMs) and other artificial
            intelligence features (&quot;AI Features&quot;). When you submit or
            provide text, links, graphics, photos, videos, or other materials to
            the Services (&quot;Input&quot;), Coding Ventures uses AI Features
            to generate outputs based on the Input (&quot;Output&quot;). Input
            and Output are collectively referred to as &quot;Customer
            Content&quot;. As between you and Coding Ventures, and to the extent
            permitted by applicable law, you retain all ownership rights in
            Input and you own all Output, and Coding Ventures hereby assigns to
            you all of our right, title, and interest, if any, in and to Output.
            By using the Services, you grant Coding Ventures a worldwide,
            non-exclusive, royalty-free, sublicensable license to access,
            reproduce, modify, distribute, transmit, export, display, store and
            otherwise use Customer Content in any and all media now known or
            later developed for the limited purpose of providing, improving, and
            protecting the Services.
          </p>

          <p className="mb-4">
            CODING VENTURES MAKES NO REPRESENTATIONS OR WARRANTIES WITH RESPECT
            TO THE ACCURACY OF ANY OUTPUTS. YOU SHOULD NOT RELY ON ANY OUTPUTS
            WITHOUT INDEPENDENTLY CONFIRMING THEIR ACCURACY. OUTPUTS MAY CONTAIN
            MATERIAL INACCURACIES EVEN IF THEY APPEAR ACCURATE BECAUSE OF THEIR
            LEVEL OF DETAIL OR SPECIFICITY. YOU ACKNOWLEDGE THAT THE SERVICES
            AND ANY OUTPUTS MAY NOT REFLECT CORRECT, CURRENT, OR COMPLETE
            INFORMATION.
          </p>

          <p className="mb-4">
            Due to the nature of generative AI models, Outputs may not be
            unique, and Outputs that the Services generate based on materials
            submitted by third parties (&quot;Third-Party Outputs&quot;) may be
            similar or identical to Outputs that the Services generate based on
            your Inputs. You acknowledge that Third-Party Outputs are not your
            Outputs and that you have no right, title, or interest in or to any
            Third-Party Outputs.
          </p>

          <p className="mb-4">
            Coding Ventures may review your conduct and content for compliance
            with these Terms. Additionally, you acknowledge and agree that
            Coding Ventures is not responsible for content that users share
            through the Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Restrictions</h2>
          <p className="mb-4">
            You may use the Services only as permitted by applicable law,
            including export control laws and regulations. Additionally, while
            using the Services, you agree not to engage in any conduct that is
            abusive or violates these Terms, including but not limited to
            breaching or circumventing any security or authentication measures;
            taking apart, decompiling or reverse engineering any part of the
            Services in an effort to access source code, algorithms, or other
            Coding Ventures intellectual property; accessing, tampering with, or
            using non-public areas or parts of the Services, or shared areas of
            the Services you have not been invited to; probing, scanning, or
            testing the vulnerability of any system or network, unless done in
            compliance with any bug bounty program we may offer; interfering
            with or disrupting any user, host, or network; selling the Services
            unless specifically authorized to do so, or purchasing the Services
            from an unauthorized seller; publishing, sharing, or storing content
            that contains child sexual abuse content or promotes extreme acts of
            violence; advocating hatred or incitement of violence against any
            person or group of people based on a protected class; accessing,
            searching, or creating accounts for the Services by any means other
            than our publicly supported interfaces; sending unsolicited
            communications, promotions or advertisements, or spam; sending
            altered, deceptive or false source-identifying information,
            including spoofing or phishing; circumventing storage space limits;
            violating the law in any way; or engaging in any type of payment
            fraud.
          </p>

          <p className="mb-4">
            Additionally, you will not and will not permit anyone else to use
            the AI Features or any Output to infringe any third-party rights;
            use the AI Features or any Output to develop, train or improve any
            AI or machine learning models; represent any Output as being
            approved or vetted by Coding Ventures; represent any Output as being
            an original work or a wholly human-generated work; use the AI
            Features for automated decision-making that has legal or similarly
            significant effects on individuals, unless it does so with adequate
            human review and in compliance with applicable laws; or use the AI
            Features for purposes or with effects that are discriminatory,
            harassing, harmful, or unethical.
          </p>

          <p className="mb-4">
            Coding Ventures reserves the right, in our sole discretion, to take
            appropriate action in response to violations of this policy, which
            could include removing or disabling access to content, suspending a
            user&apos;s access to the Services, or terminating your account.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Our Services</h2>
          <p className="mb-4">
            Subject to and conditioned on your payment of fees and compliance
            with all other terms and conditions of this Agreement, Coding
            Ventures hereby grants you a revocable, non-exclusive,
            non-transferable, non-sublicensable, limited right to access and use
            the Services solely in accordance with these Terms. The Services may
            allow you to download client software (&quot;Software&quot;), which
            may update automatically. Provided that you comply with these Terms,
            we give you a revocable, non-exclusive, non-transferable,
            non-sublicensable, limited right to use the Software, solely to
            access the Services. To the extent any component of the Software may
            be offered under an open source license, the provisions of that
            license may expressly override some of these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Beta Services</h2>
          <p className="mb-4">
            Coding Ventures may release products and features that we are still
            testing and evaluating (&quot;Beta Services&quot;). Beta Services
            are labeled &quot;beta,&quot; &quot;preview,&quot; or similar
            phrases, and may not be as reliable as our other services. Beta
            Services are made available so that we can collect user feedback,
            and by using our Beta Services, you agree to provide feedback when
            requested. Beta Services are provided on an as-is basis and may be
            discontinued at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Payment Terms</h2>
          <p className="mb-4">
            Some of our Services may require payment of fees. For all paid
            features of the Services (&quot;Paid Services&quot;), you agree to
            pay all applicable fees as set forth on our website or as otherwise
            agreed by you and Coding Ventures in writing. Unless otherwise
            specified, all fees are quoted in U.S. Dollars. You will provide us
            with a valid payment method for payment of all fees. If your payment
            method fails or your account is past due, we may collect fees using
            other collection mechanisms. Fees may vary based on your location
            and local currency, and we reserve the right to adjust our prices at
            any time.
          </p>

          <p className="mb-4">
            Unless otherwise specified, all fees for Paid Services are
            non-refundable. We may modify or discontinue the Services with or
            without notice to you and without any liability to you or any third
            party. If you are on a paid subscription, any material changes to
            the Services or fees will not impact your current subscription
            terms. Cancellation requests must be made through your account
            settings or by contacting customer support at
            support@mentopanda.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            7. Intellectual Property Rights
          </h2>
          <p className="mb-4">
            The Services are protected by copyright, trademark, and other laws
            of the United States and foreign countries. These Terms do not grant
            you any rights to use the Coding Ventures or MentoPanda trademarks,
            logos, domain names, or other brand features. Any feedback,
            comments, or suggestions you may provide regarding Coding Ventures
            or the Services is entirely voluntary and we will be free to use
            such feedback, comments, or suggestions without any obligation to
            you.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            8. Confidentiality
          </h2>
          <p className="mb-4">
            In connection with your use of the Services, you may have access to
            certain non-public information that is marked confidential or that a
            reasonable person would understand to be confidential
            (&quot;Confidential Information&quot;). You agree to protect the
            confidentiality of Coding Ventures&apos; and third-party
            Confidential Information with the same degree of care that you use
            for your own confidential information, but in no event with less
            than reasonable care. You agree not to use any Confidential
            Information for any purpose outside the scope of these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            9. Term and Termination
          </h2>
          <p className="mb-4">
            These Terms will remain in effect until terminated by either you or
            Coding Ventures. You may terminate these Terms at any time by
            canceling your account. We may suspend or terminate your access to
            the Services at any time for any reason without notice or liability
            to you. Upon termination, all licenses granted under these Terms
            will immediately terminate and you must cease all use of the
            Services. The following sections will survive termination: Your
            Content, Payment Terms (for fees incurred before termination),
            Intellectual Property Rights, Confidentiality, Term and Termination,
            Warranty Disclaimers, Limitations of Liability, and General.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            10. Third-Party Services
          </h2>
          <p className="mb-4">
            The Services may display or contain links to third-party websites,
            products, or services (&quot;Third-Party Services&quot;).
            Third-Party Services are not under Coding Ventures&apos; control,
            and Coding Ventures is not responsible for Third-Party Services or
            any changes or updates to Third-Party Services. Your use of any
            Third-Party Services is at your sole discretion and risk. We
            encourage you to read the terms and privacy policies of any
            Third-Party Services before using them.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            11. Warranty Disclaimers
          </h2>
          <p className="mb-4">
            THE SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY
            KIND. CODING VENTURES DISCLAIMS ALL WARRANTIES, EITHER EXPRESS OR
            IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
            NON-INFRINGEMENT. CODING VENTURES DOES NOT WARRANT THAT THE SERVICES
            WILL MEET YOUR REQUIREMENTS, BE UNINTERRUPTED, SECURE, ERROR-FREE,
            OR THAT ANY ERRORS WILL BE CORRECTED. NO INFORMATION OR ADVICE
            OBTAINED FROM CODING VENTURES OR THROUGH THE SERVICES SHALL CREATE
            ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            12. Limitations of Liability
          </h2>
          <p className="mb-4">
            UNDER NO CIRCUMSTANCES AND UNDER NO LEGAL THEORY SHALL CODING
            VENTURES, ITS SUPPLIERS, OR LICENSORS BE LIABLE TO YOU OR ANY THIRD
            PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
            CONSEQUENTIAL, PUNITIVE, OR OTHER SIMILAR DAMAGES, INCLUDING LOST
            PROFITS, LOST SALES OR BUSINESS, LOST DATA, BUSINESS INTERRUPTION,
            OR ANY OTHER LOSS INCURRED IN CONNECTION WITH THESE TERMS OR THE
            SERVICES, REGARDLESS OF WHETHER CODING VENTURES HAS BEEN ADVISED OF
            THE POSSIBILITY OF OR COULD HAVE FORESEEN SUCH DAMAGES.
          </p>

          <p className="mb-4">
            CODING VENTURES&apos; AGGREGATE LIABILITY ARISING OUT OF OR RELATING
            TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF $100
            OR THE AMOUNT YOU PAID CODING VENTURES IN THE PAST TWELVE MONTHS.
            THE LIMITATIONS OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS
            OF THE BASIS OF THE BARGAIN BETWEEN CODING VENTURES AND YOU.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            13. Indemnification
          </h2>
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless Coding Ventures,
            its affiliates, officers, directors, employees, consultants, agents,
            suppliers, and licensors from any and all claims, liabilities,
            damages, losses, costs, expenses, and fees (including reasonable
            attorneys&apos; fees) that arise from or relate to: (a) your use or
            misuse of the Services; (b) your content including without
            limitation all Customer Content; and (c) your violation of any
            applicable laws or regulations in connection with these Terms or the
            Services. Your indemnification obligations under this Section shall
            not apply to the extent directly caused by Coding Ventures&apos;
            breach of these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            14. Dispute Resolution
          </h2>
          <p className="mb-4">
            Before filing a claim against Coding Ventures, you agree to attempt
            to resolve the dispute by first emailing us at
            support@mentopanda.com with a description of your claim and proof of
            your relationship with Coding Ventures. We will try to resolve the
            dispute informally by following up via email, phone or other
            methods. If we cannot resolve the dispute within sixty (60) days of
            our receipt of your first email, you or Coding Ventures may then
            bring a formal proceeding.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            15. Modifications
          </h2>
          <p className="mb-4">
            We may modify these Terms from time to time, and will post the most
            current version on this site. If a modification meaningfully reduces
            your rights, we will notify you (by, for example, sending you an
            email or displaying a prominent notice within the Services). The
            notice may designate a reasonable period after which the new terms
            will take effect. Modifications will not apply retroactively. By
            continuing to use or access the Services after any modifications
            come into effect, you agree to be bound by the modified Agreement
            and price changes. If you disagree with our changes, then you must
            stop using the Services and cancel all Paid Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            16. Controlling Law
          </h2>
          <p className="mb-4">
            These Terms will be governed by California law except for its
            conflicts of laws principles. However, some countries have laws that
            require agreements to be governed by the local laws of the
            user&apos;s country. This paragraph does not override those laws.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">17. Copyright</h2>
          <p className="mb-4">
            Coding Ventures respects the intellectual property of others. We
            respond to notices of alleged copyright infringement if they comply
            with the law. We reserve the right, in our sole discretion and in
            accordance with applicable law (including the Digital Millennium
            Copyright Act of 1998), to delete or disable content alleged to be
            infringing, and to terminate accounts for actual, apparent, or
            repeat infringement without any refunds.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            18. Authorized Users
          </h2>
          <p className="mb-4">
            You are responsible for all acts and omissions of Authorized Users
            (as defined below), and any act or omission by an Authorized User
            that would constitute a breach of these Terms if taken by you will
            be deemed a breach of these Terms by you. You shall use reasonable
            efforts to make all Authorized Users aware of these Terms as
            applicable to such Authorized User&apos;s use of the Services and
            shall cause Authorized Users to comply with such provisions.
            &quot;Authorized User&quot; means an individual employee,
            consultant, contractor, or agent of Customer who is authorized by
            Customer to access and use the Services under the rights granted to
            Customer pursuant to this Agreement and solely for the benefit of
            Customer.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">19. General</h2>
          <p className="mb-4">
            These Terms constitute the entire agreement between you and Coding
            Ventures with respect to the subject matter of these Terms, and
            supersede and replace any other prior or contemporaneous agreements,
            or terms and conditions applicable to the subject matter of these
            Terms. Coding Ventures&apos; failure to enforce a provision is not a
            waiver of its right to do so later. If a provision is found
            unenforceable, the remaining provisions of the Terms will remain in
            full effect and an enforceable term will be substituted reflecting
            our intent as closely as possible. You may not assign any of your
            rights under these Terms, and any such attempt will be void. Coding
            Ventures may assign its rights to any of its affiliates or
            subsidiaries, or to any successor in interest of any business
            associated with the Services.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
