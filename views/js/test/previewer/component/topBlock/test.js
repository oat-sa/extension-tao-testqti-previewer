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
    'lodash',
    'taoQtiTestPreviewer/previewer/component/topBlock/topBlock'
], function($, _, topBlockFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof topBlockFactory, 'function', 'The topBlock module exposes a function');
        assert.equal(typeof topBlockFactory(), 'object', 'The topBlock factory produces an object');
        assert.notStrictEqual(topBlockFactory(), topBlockFactory(), 'The topBlock factory provides a different object on each call');
    });

    QUnit.cases
    .init([
        { name: 'init', title: 'init' },
        { name: 'destroy', title: 'destroy' },
        { name: 'render', title: 'render' },
        { name: 'show', title: 'show' },
        { name: 'hide', title: 'hide' },
        { name: 'enable', title: 'enable' },
        { name: 'disable', title: 'disable' },
        { name: 'is', title: 'is' },
        { name: 'setState', title: 'setState' },
        { name: 'getContainer', title: 'getContainer' },
        { name: 'getElement', title: 'getElement' },
        { name: 'getTemplate', title: 'getTemplate' },
        { name: 'setTemplate', title: 'setTemplate' }
    ])
    .test('component ', function(data, assert) {
        var instance = topBlockFactory();
        assert.equal(
            typeof instance[data.name],
            'function',
            'The topBlock instance exposes a "' + data.title + '" function'
        );
    });

    QUnit.cases
    .init([{ name: 'on', title: 'on' }, { name: 'off', title: 'off' }, { name: 'trigger', title: 'trigger' }])
    .test('eventifier ', function(data, assert) {
        var instance = topBlockFactory();
        assert.equal(
            typeof instance[data.name],
            'function',
            'The topBlock instance exposes a "' + data.title + '" function'
        );
    });

    QUnit.module('Behavior');

    QUnit.test('DOM rendering', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(8);

        const topBlock = topBlockFactory($container, {title: 'My Test', onClose: function() {
            assert.ok('true', 'The onClose has been invoked');
            topBlock.destroy();
            ready();
        },})
            .on('render', function() {
                const $element = $('.top-block-preview', $container);

                assert.equal($element.length, 1, 'The container has the component root element');
                assert.ok($element.hasClass('rendered'), 'The component root element has the rendered class');

                assert.equal($('.icon-up', $element).length, 1, 'The component has the correct level icon');
                assert.equal($('.close', $element).length, 1, 'The component has the closer');
                assert.equal($('.top-block-preview-info', $element).length, 1, 'The component has the message box');
                assert.equal(
                    $element
                        .find('.top-block-preview-info b')
                        .text()
                        .trim(),
                    'My Test',
                    'The component has the correct title'
                );

                assert.deepEqual($element[0], this.getElement()[0], 'The element is the one bound to the component');

                const $close = $('.close', $container);
                $close.click();
            });
    });
});
