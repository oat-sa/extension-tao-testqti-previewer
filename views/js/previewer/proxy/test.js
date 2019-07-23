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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test runner proxy for the QTI test previewer
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'taoQtiTestPreviewer/previewer/proxy/qtiPreviewerServiceProxy',
], function(qtiPreviewerServiceProxy) {
    'use strict';

    /**
     * Refine the proxy to supply a dedicated instance for test preview
     * @type {qtiPreviewerServiceProxy}
     */
    const qtiTestPreviewerProxy = Object.assign({}, qtiPreviewerServiceProxy);
    qtiTestPreviewerProxy.name = 'qtiTestPreviewerProxy';
    return qtiTestPreviewerProxy;
});
