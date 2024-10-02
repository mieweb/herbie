// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Documentation',
      items: [
        {
          type: 'doc',
          id: 'getting-started/Getting Started', // Path relative to the docs folder
          label: 'Getting Started Guide', // Custom label
        },
        {
          type: 'doc',
          id: 'getting-started/Basic Commands',
          label: 'Basic Commands Overview', // Custom label
        },
        {
          type: 'doc',
          id: 'getting-started/Keywords',
          label: 'Keywords', // Custom label
        },
        {
          type: 'doc',
          id: 'getting-started/Record',
          label: 'Record', // Custom label
        },
        {
          type: 'doc',
          id: 'getting-started/Savedscripts',
          label: 'Saved Scripts', // Custom label
        },
        {
          type: 'doc',
          id: 'getting-started/Logs',
          label: 'Logs', // Custom label
        }
      ],
    },
  ]
};

export default sidebars;
