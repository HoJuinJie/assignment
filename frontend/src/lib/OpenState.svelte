<script>
    export let createTask;
</script>

<div>
    <div class="header">
        <button class="createTask-button" on:click|stopPropagation={createTask()}>+TASK</button>
    </div>
</div>

<style>
    .header {
        display: flex;
        align-items: center; /* Align the button and title vertically */
        margin-left: 10px;
        margin-right: 10px;
        margin-top: 15px;
    }

    .createTask-button {
        appearance: button;
        background-color: black;
        color: white;
        border-width: 0;
        box-shadow:
            rgba(50, 50, 93, 0.1) 0 0 0 1px inset,
            rgba(50, 50, 93, 0.1) 0 2px 5px 0,
            rgba(0, 0, 0, 0.07) 0 1px 1px 0;
        box-sizing: border-box;
        font-size: 15px;
        height: 35px; /* Decreased height */
        padding: 0 15px; /* Decreased padding */
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        line-height: 35px;
        max-width: 150px; /* Optional: Restrict maximum width */
        flex-shrink: 0; /* Prevent shrinking of button */
    }
</style>