
<script>
  export let percentage = 0;
  
  // Ensure percentage is within valid range
  $: clampedPercentage = Math.max(0, Math.min(100, percentage));
</script>

<div class="progress-container">
  <div 
    id="herbie_progress" 
    class="progress-bar"
    style="width: {clampedPercentage}%"
  >
 
  </div>
</div>

