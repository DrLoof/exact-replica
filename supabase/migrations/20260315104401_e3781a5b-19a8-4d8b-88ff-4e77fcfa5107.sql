
UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide brand vision, values, and target audience overview',
    'Designate one decision-maker for feedback and approvals',
    'Provide timely feedback within 5 business days per review round',
    'Share examples of brands you admire for creative direction'
  ],
  out_of_scope = ARRAY[
    'Copywriting or tagline development',
    'Website design or development',
    'Brand photography or video production',
    'Trademark registration'
  ]
WHERE name = 'Brand Identity System' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Participate in brand workshop or stakeholder interviews',
    'Share existing marketing materials and messaging',
    'Identify key audience segments',
    'Provide feedback within agreed review windows'
  ],
  out_of_scope = ARRAY[
    'Visual identity or design work',
    'Ongoing content creation',
    'Website copywriting'
  ]
WHERE name = 'Brand Messaging & Voice' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Submit design briefs with clear requirements and copy',
    'Provide brand guidelines and asset library',
    'Give feedback within 2 business days per revision',
    'Manage print production and vendor relationships'
  ],
  out_of_scope = ARRAY[
    'Copywriting or content creation',
    'Brand identity changes or logo redesigns',
    'Video production or motion graphics'
  ]
WHERE name = 'Graphic Design Retainer' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide all page copy and imagery',
    'Provide brand guidelines and logo files',
    'Designate one decision-maker for design approvals',
    'Provide feedback within 5 business days per review round',
    'Manage domain registration and DNS settings',
    'Provide hosting credentials or approve recommended hosting'
  ],
  out_of_scope = ARRAY[
    'Copywriting (available as separate service)',
    'Professional photography or video production',
    'E-commerce functionality',
    'Ongoing maintenance after launch',
    'Third-party software licensing costs'
  ]
WHERE name = 'Website Design & Development' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide campaign goals and target audience',
    'Provide or approve final landing page copy',
    'Provide CRM/email platform access for form integration'
  ],
  out_of_scope = ARRAY[
    'Copywriting (unless bundled)',
    'Paid ad campaign management',
    'Ongoing optimization beyond initial A/B test'
  ]
WHERE name = 'Landing Page Design & Development' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide CMS and hosting credentials',
    'Submit change requests through agreed channel',
    'Maintain hosting account and domain renewal'
  ],
  out_of_scope = ARRAY[
    'Major redesigns or new feature development',
    'Content creation or copywriting',
    'SEO strategy'
  ]
WHERE name = 'Website Maintenance & Support' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Share business goals and target audience information',
    'Provide access to existing content and analytics',
    'Participate in strategy workshop (2-3 hours)',
    'Approve editorial calendar and content briefs'
  ],
  out_of_scope = ARRAY[
    'Content creation or writing (available as separate service)',
    'Graphic design for content',
    'Paid media strategy'
  ]
WHERE name = 'Content Strategy & Planning' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Approve content briefs and topics',
    'Provide subject matter expertise or access to internal experts',
    'Review and approve drafts within 3 business days',
    'Provide CMS access if agency publishes directly'
  ],
  out_of_scope = ARRAY[
    'Graphic design or custom illustrations',
    'Content promotion or social distribution',
    'Technical SEO implementation'
  ]
WHERE name = 'Blog & Article Writing' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide brand messaging framework or participate in briefing session',
    'Share target audience and key selling points',
    'Provide wireframes or page structures for copy placement',
    'Provide feedback within 5 business days'
  ],
  out_of_scope = ARRAY[
    'Blog writing or ongoing content',
    'UX/UI design or wireframing',
    'Website development'
  ]
WHERE name = 'Website Copywriting' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide email platform access or agree to copy delivery format',
    'Share subscriber list details and segmentation',
    'Approve email copy before scheduling'
  ],
  out_of_scope = ARRAY[
    'Email template design',
    'Email platform setup or migration',
    'Marketing automation setup'
  ]
WHERE name = 'Email Copywriting' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide Google Analytics and Search Console access',
    'Provide CMS access for on-page changes',
    'Implement technical fixes or provide developer access',
    'Share business priorities and seasonal patterns'
  ],
  out_of_scope = ARRAY[
    'Content writing (available as separate service)',
    'Paid search/PPC management',
    'Website design or major development changes'
  ]
WHERE name = 'SEO Strategy & Implementation' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide Google Business Profile access',
    'Verify business information accuracy',
    'Respond to customer reviews (or approve agency responses)',
    'Provide photos of business location and team'
  ],
  out_of_scope = ARRAY[
    'Paid local advertising',
    'Website development',
    'Multi-location enterprise SEO'
  ]
WHERE name = 'Local SEO' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide social platform login credentials',
    'Approve monthly content calendar before publishing',
    'Share company news, events, and promotions',
    'Provide product photos and behind-the-scenes content'
  ],
  out_of_scope = ARRAY[
    'Paid social advertising (available as separate service)',
    'Influencer marketing and partnerships',
    'Professional video production',
    'Crisis communications'
  ]
WHERE name = 'Social Media Management' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Film raw footage per agency guidance',
    'Approve concepts and final edits before publishing',
    'Participate in on-camera content if required'
  ],
  out_of_scope = ARRAY[
    'Professional videography or on-site filming',
    'Long-form video production',
    'Paid promotion of videos'
  ]
WHERE name = 'Short-Form Video Content' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide Google Ads account access',
    'Fund ad spend directly (separate from management fee)',
    'Approve ad copy and landing pages',
    'Share conversion data and sales feedback'
  ],
  out_of_scope = ARRAY[
    'Ad spend budget (billed directly by platform)',
    'Landing page design and development',
    'Organic SEO'
  ]
WHERE name = 'Paid Search (PPC) Management' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide ad platform access and Business Manager admin',
    'Fund ad spend directly',
    'Provide or approve imagery and video for ads',
    'Share audience insights and customer data'
  ],
  out_of_scope = ARRAY[
    'Ad spend budget',
    'Professional photography or video production',
    'Organic social media management',
    'Landing page creation'
  ]
WHERE name = 'Paid Social Advertising' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide email platform access',
    'Share subscriber lists and consent documentation',
    'Approve email campaigns before sending',
    'Maintain compliance with email regulations (GDPR, CAN-SPAM)'
  ],
  out_of_scope = ARRAY[
    'Email platform subscription costs',
    'List building or lead generation',
    'SMS/text message marketing'
  ]
WHERE name = 'Email Marketing Management' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide platform credentials and admin access',
    'Define lead qualification criteria with sales team',
    'Participate in workflow planning sessions',
    'Ensure sales team adoption of new workflows'
  ],
  out_of_scope = ARRAY[
    'Platform subscription fees',
    'Email copywriting (available as separate service)',
    'CRM customization beyond marketing integration',
    'Data migration from legacy systems'
  ]
WHERE name = 'Marketing Automation Setup' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide website and platform access for tracking setup',
    'Provide Google Analytics and Tag Manager access',
    'Define key business metrics and goals',
    'Ensure developer availability for tag installation'
  ],
  out_of_scope = ARRAY[
    'Data warehousing or BI tool development',
    'CRM analytics or sales reporting',
    'Custom data science or machine learning'
  ]
WHERE name = 'Analytics & Reporting Setup' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Share business goals, revenue targets, and budget constraints',
    'Provide access to existing marketing data and spend',
    'Participate actively in strategy sessions',
    'Designate decision-maker with authority to approve strategy'
  ],
  out_of_scope = ARRAY[
    'Tactical execution of strategy recommendations',
    'Sales strategy or process optimization',
    'Product development strategy'
  ]
WHERE name = 'Marketing Strategy & Consulting' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide website and analytics access',
    'Provide developer resources for test implementation if needed',
    'Approve test hypotheses before launch',
    'Implement winning variations permanently after testing'
  ],
  out_of_scope = ARRAY[
    'Website redesign',
    'Traffic generation or paid advertising',
    'Mobile app optimization'
  ]
WHERE name = 'CRO & A/B Testing' AND is_default = true;

UPDATE service_modules SET
  client_responsibilities = ARRAY[
    'Provide newsworthy stories, launches, and milestones',
    'Designate spokesperson(s) available for media requests',
    'Approve press releases before outreach',
    'Respond to media interview requests promptly'
  ],
  out_of_scope = ARRAY[
    'Paid media or sponsored content',
    'Event planning and logistics',
    'Social media management'
  ]
WHERE name = 'PR & Media Relations' AND is_default = true;
