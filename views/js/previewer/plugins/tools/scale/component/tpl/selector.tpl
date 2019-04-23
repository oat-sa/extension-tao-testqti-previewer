<select class="select2" name="{{name}}" data-category="{{category}}" data-has-search="false">
    {{#each items}}
    <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    {{/each}}
</select>
