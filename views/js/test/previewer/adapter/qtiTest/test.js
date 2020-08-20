/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define([

    'jquery',
    'taoQtiTestPreviewer/previewer/adapter/test/qtiTest',
    'json!taoQtiTestPreviewer/test/samples/json/initTestPreview.json',
    'json!taoQtiTestPreviewer/test/samples/json/itemData.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function($, previewerAdapter, initTestPreview, itemData) {
    'use strict';

    QUnit.module('API');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.test('module', function(assert) {
        assert.expect(2);
        assert.equal(typeof previewerAdapter, 'object', 'The previewerAdapter module exposes an object');
        assert.equal(typeof previewerAdapter.init, 'function', 'The previewerAdapter object has a init() method');
    });

    QUnit.test('integration', function(assert) {
        var ready = assert.async();
        var serviceCallId = 'previewer';
        var testUri = '35';
        var configInteractive = {
            serviceCallId: serviceCallId,
            fullPage: true
        };
        var configReadOnly = {
            serviceCallId: serviceCallId,
            fullPage: true,
            readOnly: true
        };


        function displayPreviewer(config) {
            $.mockjax.clear();

            $.mockjax({
                url: '*/init',
                responseText: initTestPreview
            });

            $.mockjax({
                url: '*/getItem',
                responseText: itemData
            });

            return previewerAdapter.init(testUri, config);
        }

        assert.expect(1);

        displayPreviewer(configReadOnly)
            .before('ready', function(e, runner) {
                runner.after('renderitem.runnerComponent', function() {
                    assert.ok(true, 'The previewer has been rendered');
                    ready();
                });
            });

        $('#show-interactive').on('click', function(e) {
            e.preventDefault();
            displayPreviewer(configInteractive);
        });

        $('#show-readonly').on('click', function(e) {
            e.preventDefault();
            displayPreviewer(configReadOnly);
        });
    });
});
