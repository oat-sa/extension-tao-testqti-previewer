<select data-width="130" class="preview-type-selector select2" data-has-search="false">
    {{#each items}}
    <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    {{/each}}
</select>