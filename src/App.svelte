<script>
	import { fade } from 'svelte/transition';
	import Dropdown from './components/Dropdown.svelte';
	import HerbieMain from './tabs/HerbieMain.svelte';
	import LogTab from './tabs/LogTab.svelte';
	import SavedScripts from './tabs/SavedScripts.svelte';
	import Keywords from './tabs/Keywords.svelte';
	import RecordTab from './tabs/RecordTab.svelte';
	import UsabilityTesting from './tabs/UsabilityTesting.svelte';
    import InjectHerbie from './tabs/InjectHerbie.svelte';
  	import SettingsTab from './tabs/Settings.svelte';
	let activeTab = 'tab1'; // Default active tab
  
	// Map activeTab to components
	const components = {
	  tab1: HerbieMain,
	  tab2: LogTab,
	  tab3: SavedScripts,
	  tab4: Keywords,
	  tab5: RecordTab,
	  tab6: UsabilityTesting,
	  tab7:InjectHerbie,
	  tab8:SettingsTab
	};
  
	// Reactive assignment to update CurrentTab
	$: CurrentTab = components[activeTab];
  </script>
  
  <div>
	<!-- Dropdown for selecting tabs -->
	<Dropdown bind:activeTab />
  
	<!-- Dynamically render the selected tab with a wrapper for the transition -->
	{#if CurrentTab}
  <div transition:fade>
    <svelte:component this={CurrentTab} bind:activeTab />
  </div>
{/if}
  </div>
  

  