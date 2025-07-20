<script>
    import { onMount } from "svelte";
  export let activeTab;

  const tabs = [
    { id: 'tab1', label: 'Herbie' },
     { id: 'tab6', label: 'Usability Testing' },
    { id: 'tab3', label: 'Saved Scripts' },
    { id: 'tab4', label: 'Keywords' },
    // { id: 'tab5', label: 'Record' },
   
    { id: 'tab2', label: 'Logs' },
    // { id: 'tab7', label: 'Inject Herbie' },
    { id: 'tab8', label: 'Settings' },
  ];

  let isDropdownVisible = false;

  function toggleDropdown() {
    isDropdownVisible = !isDropdownVisible;
  }

  function selectTab(tabId) {
    activeTab = tabId;
    isDropdownVisible = false; // Close dropdown after selection
    chrome.storage.local.set({ activeTab: tabId });
  }
  onMount(() => {
    chrome.storage.local.get("activeTab", (result) => {
      activeTab = result.activeTab || "tab1"; // Default to 'tab1' if no stored tab
    });
    chrome.storage.local.get("usabilityTest", (result) => {
      
      if(result.usabilityTest.description){
        activeTab = "tab6";
      }else{
        activeTab = result.activeTab || "tab1"; 
      }
       
    });
  });
</script>

<div class="dropdown-container">
  <button class="hamburger-button" on:click={toggleDropdown} aria-label="Menu">
    ☰
  </button>
  {#if isDropdownVisible}
    <div class="dropdown-menu">
      {#each tabs as tab}
        <button
          class="dropdown-item {activeTab === tab.id ? 'active' : ''}"
          on:click={() => selectTab(tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown-container {
    position: relative;
    display: flex;
    justify-content: flex-end; /* Align to the right */
    padding: 10px;
    background-color: #f8f9fa;
  }

  .hamburger-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    outline: none;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    width: 200px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    animation: fadeIn 0.3s ease;
    padding: 8px; /* Added padding for better spacing */
  }

  /* Initial Style for Dropdown Items */
  .dropdown-item {
    background-color: white; /* Initial white background */
    color: black; /* Initial black text color */
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--button-border-radius-md, 8px); /* Fallback */
    font-size: var(--font-size-md, 16px); /* Fallback */
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base, all 0.3s ease);
    margin-bottom: 8px; /* Added spacing between items */
    box-shadow: none; /* No shadow initially */
  }

  /* Hover Effect for Dropdown Items */
  .dropdown-item:hover {
    background-color: var(--primary-base, #007bff); /* Blue background on hover */
    color: var(--base-white, #ffffff); /* White text on hover */
    box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2)); /* Shadow on hover */
  }

  /* Active Style for Dropdown Items */
  .dropdown-item.active {
    background-color: var(--primary-base, #007bff); /* Active background color */
    color: var(--base-white, #ffffff); /* Active text color */
    box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2)); /* Shadow for active item */
  }

  /* Animation */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
