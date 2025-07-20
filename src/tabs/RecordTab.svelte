<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  let actions = writable([]);
  let expandedIndex = writable(null); // To track which action is expanded
  let editingIndex = writable(null); // To track which line name is being edited
  let editedText = writable(""); // Temporary store for editing line names

  // Fetch actions from Chrome storage on mount
  onMount(() => {
    chrome.storage.local.get(["actions"], (result) => {
      actions.set(result.actions || []);
    });
  });

  // Remove an action
  function removeAction(index) {
    actions.update((currentActions) => {
      let updatedActions = [...currentActions];
      updatedActions.splice(index, 1);
      chrome.storage.local.set({ actions: updatedActions });
      return updatedActions;
    });
  }

  // Toggle full text visibility
  function toggleExpand(index) {
    expandedIndex.update((current) => (current === index ? null : index));
  }

  // Handle drag start
  function handleDragStart(event, index) {
    event.dataTransfer.setData("text/plain", index);
    event.dataTransfer.effectAllowed = "move";
  }

  // Handle drop
  function handleDrop(event, newIndex) {
    event.preventDefault();
    const oldIndex = event.dataTransfer.getData("text/plain");

    if (oldIndex !== newIndex) {
      actions.update((currentActions) => {
        let updatedActions = [...currentActions];
        const [movedItem] = updatedActions.splice(oldIndex, 1);
        updatedActions.splice(newIndex, 0, movedItem);
        chrome.storage.local.set({ actions: updatedActions });
        return updatedActions;
      });
    }
  }

  // Prevent default behavior on drag over
  function allowDrop(event) {
    event.preventDefault();
  }

  // Enable editing mode
  function startEditing(index, text) {
    editingIndex.set(index);
    editedText.set(text);
  }

  // Save edited text
  function saveEdit(index) {
    actions.update((currentActions) => {
      currentActions[index].src = editedText;
      chrome.storage.local.set({ actions: currentActions });
      return currentActions;
    });
    editingIndex.set(null);
  }
</script>

<div id="tab5" class="record-tab">
  <h2 class="record-title">Record Actions</h2>

  <!-- Draggable Actions Section -->
  <div class="draggable-actions">
    <div class="draggable-button" draggable="true" data-command="click" aria-label="Click">
      <i class="fas fa-mouse-pointer"></i>
      <span>Click</span>
    </div>
    <div class="draggable-button" draggable="true" data-command="type" aria-label="Type">
      <i class="fas fa-keyboard"></i>
      <span>Type</span>
    </div>
    <div class="draggable-button" draggable="true" data-command="wait" aria-label="Wait">
      <i class="fas fa-clock"></i>
      <span>Wait</span>
    </div>
    <div class="draggable-button" draggable="true" data-command="verify" aria-label="Verify">
      <i class="fas fa-check"></i>
      <span>Verify</span>
    </div>
  </div>

  <!-- Action Controls Section -->
  <div class="action-controls">
    <button id="record_run" class="record-button action-button" aria-label="Run Script">Run</button>
    <button id="save_actions" class="record-button action-button" aria-label="Save Actions">Save</button>
    <button id="clear_actions" class="record-button action-button" aria-label="Clear Actions">Clear</button>
  </div>

  <!-- Actions Container (Draggable, Editable & Removable Items) -->
  <div id="actions_container">
    {#each $actions as action, index}
      <div
        class="action-item"
        draggable="true"
        on:dragstart={(event) => handleDragStart(event, index)}
        on:dragover={allowDrop}
        on:drop={(event) => handleDrop(event, index)}
      >
        <!-- Action Name (Editable) -->
        {#if $editingIndex === index}
          <input type="text" bind:value={$editedText} class="edit-input" on:blur={() => saveEdit(index)} />
        {:else}
          <span class="action-name" on:dblclick={() => startEditing(index, action.src)}>
            {$expandedIndex === index ? action.src : action.src.length > 50 ? action.src.slice(0, 50) + "..." : action.src}
          </span>
        {/if}

        <!-- Expand/Collapse Button -->
        <i class="fas fa-eye action-icon" on:click={() => toggleExpand(index)}></i>

        <!-- Delete Button -->
        <i class="fas fa-trash-alt delete-btn" on:click={() => removeAction(index)}></i>
      </div>
    {/each}
  </div>
</div>

<style>
  :global(body) {
    font-family: "Arial", sans-serif;
    background-color: #f4f4f4;
  }

  .record-tab {
    max-width: 350px;
    padding: 15px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    margin: 0 auto;
  }

  .record-title {
    font-size: 18px;
    color: #333;
    margin-bottom: 15px;
  }

  /* Draggable Action Buttons */
  .draggable-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .draggable-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    width: 60px;
    height: 60px;
    border: none;
    background: #ffffff;
    border-radius: 6px;
    cursor: grab;
    font-size: 16px;
    transition: background 0.2s ease-in-out;
  }

  .draggable-button i {
    font-size: 20px;
    margin-bottom: 5px;
  }

  .draggable-button span {
    font-size: 12px;
    color: #333;
  }

  /* Actions Container */
  #actions_container {
    margin-top: 10px;
    background: #f8f9fa;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 6px;
    min-height: 100px;
    overflow-y: auto;
  }

  /* Individual Action Item */
  .action-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: white;
    border-radius: 6px;
    border: 1px solid #ddd;
    margin-bottom: 5px;
    cursor: grab;
    transition: background 0.2s ease-in-out;
  }

  .action-item:hover {
    background: #e9ecef;
  }

  .action-name {
    font-size: 14px;
    color: #333;
    flex-grow: 1;
    text-align: left;
    cursor: pointer;
  }

  .edit-input {
    flex-grow: 1;
    font-size: 14px;
    border: 1px solid #ccc;
    padding: 4px;
    border-radius: 4px;
  }

  .action-icon {
    margin-left: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #007bff;
  }

  .delete-btn {
    color: red;
    cursor: pointer;
    font-size: 14px;
    margin-left: 8px;
  }
</style>
