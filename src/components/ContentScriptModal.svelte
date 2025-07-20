<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  function enableContentScripts() {
    dispatch('enable');
  }

  function closeModal() {
    dispatch('close');
  }

  function goToSettings() {
    dispatch('settings');
  }

  // Prevent modal from closing when clicking inside
  function handleModalClick(event) {
    event.stopPropagation();
  }
</script>

<!-- Modal Backdrop -->
<div class="modal-backdrop" on:click={closeModal}>
  <!-- Modal Content -->
  <div class="modal-content" on:click={handleModalClick}>
    <div class="modal-header">
      <div class="modal-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2>Content Scripts Disabled</h2>
      <button class="close-button" on:click={closeModal}>
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="modal-body">
      <p class="main-message">
        Herbie's content scripts are currently disabled. Most features require content scripts to function properly.
      </p>

      <div class="features-list">
        <h3>Disabled Features:</h3>
        <ul>
          <li><i class="fas fa-play"></i> Script execution on web pages</li>
          <li><i class="fas fa-search"></i> Element inspection and XPath capture</li>
          <li><i class="fas fa-user-check"></i> Usability testing automation</li>
          <li><i class="fas fa-check-circle"></i> Verification and assertions</li>
          <li><i class="fas fa-mouse-pointer"></i> Element interaction simulation</li>
          <li><i class="fas fa-syringe"></i> Interface injection</li>
        </ul>
      </div>

      <div class="warning-box">
        <i class="fas fa-info-circle"></i>
        <p>
          Content scripts allow Herbie to interact with web pages safely and securely. 
          They only activate when you use Herbie features and follow Chrome extension security guidelines.
        </p>
      </div>
    </div>

    <div class="modal-footer">
      <button class="button secondary" on:click={closeModal}>
        <i class="fas fa-times"></i>
        Continue Anyway
      </button>
      
      <button class="button primary" on:click={enableContentScripts}>
        <i class="fas fa-power-off"></i>
        Enable Content Scripts
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e9ecef;
    position: relative;
  }

  .modal-icon {
    background: #ffc107;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
    flex: 1;
  }

  .close-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #6c757d;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: #f8f9fa;
    color: #495057;
  }

  .modal-body {
    padding: 20px 24px;
  }

  .main-message {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #495057;
    line-height: 1.5;
  }

  .features-list h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #333;
    font-weight: 600;
  }

  .features-list ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .features-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    color: #6c757d;
    font-size: 14px;
  }

  .features-list li i {
    color: #dc3545;
    width: 16px;
    text-align: center;
  }

  .warning-box {
    background: #e7f3ff;
    border: 1px solid #b3d7ff;
    border-radius: 6px;
    padding: 16px;
    margin-top: 20px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .warning-box i {
    color: #0066cc;
    font-size: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .warning-box p {
    margin: 0;
    font-size: 13px;
    color: #004085;
    line-height: 1.4;
  }

  .modal-footer {
    padding: 16px 24px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    border-top: 1px solid #e9ecef;
  }

  .button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    min-width: 140px;
    justify-content: center;
  }

  .button.secondary {
    background: #f8f9fa;
    color: #6c757d;
    border: 1px solid #ced4da;
  }

  .button.secondary:hover {
    background: #e9ecef;
    color: #495057;
  }

  .button.primary {
    background: #28a745;
    color: white;
  }

  .button.primary:hover {
    background: #218838;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .modal-content {
      margin: 20px;
      width: calc(100% - 40px);
    }

    .modal-footer {
      flex-direction: column;
    }

    .button {
      width: 100%;
    }
  }
</style>