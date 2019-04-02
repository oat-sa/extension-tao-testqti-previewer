<select class="preview-type-selector">
    {{#each items}}
    <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    {{/each}}
</select>