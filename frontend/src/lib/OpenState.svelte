<script>
    export let createTask;
</script>

<div>
    <div class="header">
        <div class="titleText">Open</div>
        <button class="createTask-button" on:click|stopPropagation={createTask()}>CREATE TASK</button>
    </div>
</div>