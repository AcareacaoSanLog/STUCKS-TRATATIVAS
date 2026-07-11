(function () {
  'use strict';

  // Campos mínimos para aceitar a importação. Driver e tratativa ficam opcionais
  // para não travar quando a base vier sem responsável ou sem palavra-chave.
  var REQUIRED_FIELDS = [
    'shipment_id',
    'tracking_status',
    'ageing_last_status',
    'cogs',
    'buyer_city'
  ];

  var IMPORT_FIELDS = [
    'shipment_id',
    'tracking_status',
    'ageing_last_status',
    'cogs',
    'buyer_city',
    'driver_id',
    'driver_name'
  ];

  var OPTIONAL_FIELDS = ['driver_id', 'avaria', 'cep', 'tratativa'];
  var BASE_COLUMNS = IMPORT_FIELDS.concat(['cep', 'cidade_cep', 'bairro', 'status_cep', 'avaria', 'tratativa', 'prioridade']);
  // Colunas usadas na exportação da base. IMPORTANTE: faixa_ageing é só para filtro interno
  // e nunca deve sair na planilha, porque vira 2-3, 4-6, 7-9 ou 10+.
  var EXPORT_BASE_COLUMNS = [
    'shipment_id',
    'tracking_status',
    'ageing_last_status',
    'cogs',
    'buyer_city',
    'driver_id',
    'driver_name',
    'cep',
    'cidade_cep',
    'bairro',
    'status_cep',
    'avaria',
    'prioridade',
    'tratativa'
  ];

  var FIELD_LABELS = {
    shipment_id: 'shipment_id',
    tracking_status: 'tracking_status',
    ageing_last_status: 'ageing_last_status',
    cogs: 'cogs (R$)',
    buyer_city: 'buyer_city',
    driver_id: 'driver_id',
    driver_name: 'driver_name',
    tratativa: 'tratativa',
    cep: 'CEP',
    cidade_cep: 'Cidade CEP',
    bairro: 'Bairro',
    status_cep: 'Status CEP',
    avaria: 'avaria',
    prioridade: 'Prioridade',
    faixa_ageing: 'Faixa ageing'
  };

  var FIELD_ALIASES = {
    shipment_id: ['shipment_id', 'shipment id', 'br', 'tn', 'tracking', 'tracking id', 'tracking number', 'tracking_number', 'sls tracking number', 'slstrackingnumber', 'rastreio', 'codigo rastreio', 'codigorastreio', 'br do pacote', 'pacote', 'id pacote', 'pedido', 'orderid', 'order id'],
    tracking_status: ['tracking_status', 'tracking status', 'status', 'status tracking', 'last status', 'ultimo status', 'último status', 'status atual', 'status atualizado', 'status da br', 'status do pacote', 'status pedido'],
    ageing_last_status: ['ageing_last_status', 'aging_last_status', 'ageing last status', 'aging last status', 'ageing', 'aging', 'dias parados', 'diasparados', 'days', 'dias', 'dias parado', 'idade status', 'idade do status', 'aging days', 'ageing days'],
    cogs: ['cogs', 'cog', 'valor', 'valor r$', 'cost', 'custo', 'cogs r$', 'cod amount', 'codamount', 'amount', 'original asf', 'originalasf'],
    buyer_city: ['buyer_city', 'buyer city', 'cidade', 'cidade comprador', 'buyer cidade', 'city', 'cidade destino', 'destino'],
    driver_id: ['driver_id', 'driver id', 'id driver', 'id motorista', 'motorista id', 'id entregador', 'id do entregador'],
    driver_name: ['driver_name', 'driver name', 'nome driver', 'nome motorista', 'motorista', 'entregador', 'driver', 'nome entregador', 'nome do entregador', 'responsavel', 'responsável'],
    tratativa: ['tratativa', 'tratativas', 'palavra chave', 'palavrachave', 'palavra-chave', 'keyword', 'observacao', 'observação', 'obs', 'motivo', 'tratamento', 'comentario', 'comentário'],
    avaria: ['avaria', 'damaged tag', 'damagedtag', 'damage', 'danificado', 'avariado'],
    cep: ['cep', 'zipcode', 'zip code', 'zip', 'postalcode', 'postal code', 'cep destino', 'cep do pedido', 'cep pacote']
  };

  var CEP_REFERENCE_INITIAL = [{"cep":"45988126","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO JOSÉ"},{"cep":"45920000","cidade":"NOVA VIÇOSA","bairro":""},{"cep":"45836000","cidade":"ITAMARAJU","bairro":""},{"cep":"45987088","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45990250","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45928000","cidade":"POSTO DA MATA","bairro":""},{"cep":"45985025","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45993419","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45930000","cidade":"MUCURI","bairro":""},{"cep":"45990078","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45936000","cidade":"ITABATÃ","bairro":""},{"cep":"45993000","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45992562","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45994302","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45992399","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45988493","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45909000","cidade":"BARCELONA","bairro":""},{"cep":"45980000","cidade":"PRADO","bairro":""},{"cep":"45985114","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45989121","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45834000","cidade":"JUCURUÇU","bairro":""},{"cep":"45900000","cidade":"CARAVELAS","bairro":""},{"cep":"45910000","cidade":"ALCOBAÇA","bairro":""},{"cep":"45988556","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45994773","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45985200","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45970000","cidade":"ITANHÉM","bairro":""},{"cep":"45994725","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45988560","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45994643","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45987638","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990406","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45985210","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990458","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45983000","cidade":"PRADO","bairro":""},{"cep":"45994707","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994102","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994782","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45998000","cidade":"SANTO ANTONIO","bairro":""},{"cep":"45987476","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45990362","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45989270","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45987368","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45994853","cidade":"VEREDA","bairro":""},{"cep":"45989617","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45955000","cidade":"VEREDA","bairro":""},{"cep":"45987464","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45960000","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45985007","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45988496","cidade":"ITAMARAJU","bairro":""},{"cep":"45940000","cidade":"IBIRAPUÃ","bairro":""},{"cep":"45985108","cidade":"PRADO","bairro":""},{"cep":"45987392","cidade":"IBIRAPUÃ","bairro":""},{"cep":"45990752","cidade":"ITANHÉM","bairro":""},{"cep":"45950000","cidade":"LAJEDÃO","bairro":""},{"cep":"45989064","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994889","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45990000","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45985186","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993243","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45989144","cidade":"PRADO","bairro":""},{"cep":"45991074","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45993437","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45990426","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45988514","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45992638","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45989172","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45990310","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992147","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45985303","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45987580","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990678","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45991020","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45992390","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45992108","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45993270","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45993018","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45993187","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990160","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45987324","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT 2)"},{"cep":"45991150","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45987400","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45991034","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 3"},{"cep":"45993292","cidade":"TEIXEIRA DE FREITAS","bairro":"ALTO DO TANCREDO"},{"cep":"45990114","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45993153","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45992150","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45990090","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45994640","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45989040","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45985228","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45986000","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45990494","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990063","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45993261","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45994226","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45992384","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45992138","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45989431","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45990313","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45989140","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45987360","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45987096","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45993183","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45987564","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45988594","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45985294","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45989202","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45993144","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45992111","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45985154","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987156","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45992554","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45989482","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45994850","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994282","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45985066","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985188","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988590","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45994369","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45987562","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45990774","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45987124","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45994779","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994114","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45992630","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45993162","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45985216","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990480","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45987022","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45986370","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45990232","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45993431","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45985601","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45994290","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45989479","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45992566","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45987388","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45989052","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45991040","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 3"},{"cep":"45990235","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45991016","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45994704","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45990528","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990217","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45989488","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45985218","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45992666","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45989244","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45985297","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985098","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45994363","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45986342","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45985017","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45987578","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45994788","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45986032","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45992542","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45993279","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45991138","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45987308","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45985128","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988606","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45990378","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45986016","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45994018","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985422","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45993179","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45985160","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45994710","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45992674","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45993165","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45994393","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45985273","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45986040","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45988484","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45994167","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45987312","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45991810","cidade":"TEIXEIRA DE FREITAS","bairro":"POLO INDUSTRIAL"},{"cep":"45987120","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45994009","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45992420","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45990710","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45993033","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45993249","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45994129","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45990247","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992694","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45985589","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45987552","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45987376","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45992180","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45990283","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992078","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994210","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994190","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994731","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994048","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45990241","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992135","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992195","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994266","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994794","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45989500","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45990289","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45986100","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45994090","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45991022","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45987372","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45992159","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994764","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45992144","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45991006","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45987486","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45985630","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985342","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45990666","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45992426","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45988152","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45994258","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45987112","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45993231","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45988074","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO JOSÉ"},{"cep":"45993440","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45985194","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990301","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990286","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990840","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45992219","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN"},{"cep":"45993129","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45991176","cidade":"TEIXEIRA DE FREITAS","bairro":"PORTAL SUL"},{"cep":"45985214","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993422","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45994262","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45985212","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45994339","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985309","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45992246","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN"},{"cep":"45994737","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994722","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45985336","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45993252","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45988540","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45989061","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45988481","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45993289","cidade":"TEIXEIRA DE FREITAS","bairro":"ALTO DO TANCREDO"},{"cep":"45992303","cidade":"TEIXEIRA DE FREITAS","bairro":"UNIVERSITÁRIO"},{"cep":"45992432","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE SUL"},{"cep":"45994728","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994045","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45990834","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45993195","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45985124","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993434","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45993413","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45992490","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45993286","cidade":"TEIXEIRA DE FREITAS","bairro":"ALTO DO TANCREDO"},{"cep":"45988162","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45992297","cidade":"TEIXEIRA DE FREITAS","bairro":"UNIVERSITÁRIO"},{"cep":"45986354","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45992375","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45992069","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45988596","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45987296","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45992093","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45989170","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45994152","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994240","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994075","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45986378","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45994298","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994322","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45989254","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45989148","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45992174","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994000","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45987556","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45985333","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45992000","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45987104","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45989234","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45992039","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992168","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994078","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45988475","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45990208","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45986959","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988554","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45990384","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45987586","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45990111","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45989206","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989130","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994797","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45993443","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45990566","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45989155","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45994006","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985222","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993006","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45989272","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45993171","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45994033","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45991002","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45989058","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45992057","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45990280","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45987478","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45987352","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45988562","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45993295","cidade":"TEIXEIRA DE FREITAS","bairro":"ALTO DO TANCREDO"},{"cep":"45990798","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45985126","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45989163","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45990148","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45985102","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45972000","cidade":"ITANHÉM","bairro":""},{"cep":"45908000","cidade":"JUERANA","bairro":""},{"cep":"45992606","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45990214","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45985663","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985192","cidade":"TEIXEIRA DE FREITAS","bairro":"CIDADE DE DEUS 1"},{"cep":"45994238","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45989192","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989250","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45993225","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45987466","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45985180","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45994030","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45993199","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45993271","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45995058","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45990618","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45992096","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45991152","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45992405","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45988502","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45987231","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM EUROPA"},{"cep":"45993054","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45994683","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45993246","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45992381","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45990742","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990145","cidade":"ITANHÉM","bairro":""},{"cep":"45992102","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45988584","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45992498","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45989413","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45985040","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45987384","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990368","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45986028","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45990003","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45994054","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45987472","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45990292","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45989082","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45992060","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45990066","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45988588","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45923000","cidade":"HELVECIA","bairro":""},{"cep":"45925000","cidade":"ARGOLO","bairro":""},{"cep":"45958000","cidade":"VEREDA","bairro":""},{"cep":"45991118","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45988644","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45993081","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45985720","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45992129","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992132","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45991062","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45994667","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45992105","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992550","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45990151","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45993465","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45986064","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45985324","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45990878","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45992372","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45985118","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987059","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVO HORIZONTE"},{"cep":"45990862","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45993036","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45987436","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45987558","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45985178","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985654","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45990009","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990758","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45989055","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45985396","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45993273","cidade":"HELVECIA","bairro":""},{"cep":"45985348","cidade":"ARGOLO","bairro":""},{"cep":"45985279","cidade":"VEREDA","bairro":""},{"cep":"45989146","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994749","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45986068","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45990724","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45992336","cidade":"TEIXEIRA DE FREITAS","bairro":"UNIVERSITÁRIO"},{"cep":"45989142","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45987764","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990664","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45993234","cidade":"TEIXEIRA DE FREITAS","bairro":"CIDADE DE DEUS 1"},{"cep":"45988070","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO JOSÉ"},{"cep":"45987316","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45988175","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45990640","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45985156","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987034","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45987255","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM EUROPA"},{"cep":"45987028","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45992366","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45985015","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45990012","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990526","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990154","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45985122","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45994348","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45988624","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45993024","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45990388","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45992054","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992650","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45990508","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45994160","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994120","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45993201","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45988636","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45987002","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45989246","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45994096","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994216","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL RAMALHO"},{"cep":"45992300","cidade":"TEIXEIRA DE FREITAS","bairro":"UNIVERSITÁRIO"},{"cep":"45989210","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45990130","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45989118","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994176","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45988323","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA FELIZ"},{"cep":"45988170","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45990045","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45993051","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45987462","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45994012","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994188","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45993359","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45992393","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45985660","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45989028","cidade":"TEIXEIRA DE FREITAS","bairro":"IRMÃ DULCE"},{"cep":"45987470","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45990750","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45993213","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45989188","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989049","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994776","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45986052","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45994162","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45999000","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45985148","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993048","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45988460","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45994278","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45992514","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45992021","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992538","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45985366","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45990120","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45985106","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45991044","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 3"},{"cep":"45988144","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45990226","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45987474","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT)"},{"cep":"45985158","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45993283","cidade":"TEIXEIRA DE FREITAS","bairro":"ALTO DO TANCREDO"},{"cep":"45994254","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994108","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45991106","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45987626","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL ANTONIO COSTA FILHO"},{"cep":"45987348","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45986088","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45990414","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45995324","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL TERRAS DA BAHIA"},{"cep":"45987408","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45993275","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45989079","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45990882","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45994761","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45990846","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45994063","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45968000","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45990178","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45994880","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45991086","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45987108","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45992066","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45991000","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45994740","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45990746","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990434","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990662","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45990868","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990410","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45992009","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45990534","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45988174","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45987292","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990472","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45965000","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45987024","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45986390","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45985410","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45985236","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987260","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990546","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45992099","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE"},{"cep":"45994099","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45989485","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45992045","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45992006","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994713","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45990562","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45985270","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45987018","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45994658","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45990786","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45991038","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 3"},{"cep":"45987249","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM EUROPA"},{"cep":"45993141","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990844","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990102","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45992429","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45989182","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989157","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45992171","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45987071","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVO HORIZONTE"},{"cep":"45985372","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45990576","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45985198","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988058","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO JOSÉ"},{"cep":"45994174","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45990676","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45985116","cidade":"MEDEIROS NETO","bairro":""},{"cep":"45985669","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45992198","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994178","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45990558","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45987136","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45992153","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45993425","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45992634","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45990622","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990402","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45988566","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45989260","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45994375","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45995050","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988614","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45995338","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL TERRAS DA BAHIA"},{"cep":"45988156","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45993447","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45990468","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990608","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990319","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45985300","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45988608","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR"},{"cep":"45990854","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45994883","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45992090","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45994664","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45988640","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45990117","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45987636","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL ANTONIO COSTA FILHO"},{"cep":"45989204","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45990612","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45992120","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45990259","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990108","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990420","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45987630","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45989422","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45985723","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45988642","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45992387","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45990614","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45994716","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45988505","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45990570","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45985394","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45989115","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45990674","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45994050","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45987356","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45990858","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45985182","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990606","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45989262","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45992036","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45986072","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45985412","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45988320","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA FELIZ"},{"cep":"45990791","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45987778","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45993138","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45993127","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990740","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45993060","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45994342","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45987740","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45987176","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45989109","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994111","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994270","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45993401","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45992012","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45985675","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45990620","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990354","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45992530","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45987026","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45994186","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45985666","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45992441","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45986338","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45993135","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45994228","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45992670","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45992126","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45987092","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45990262","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992141","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO LOURENÇO"},{"cep":"45985196","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987340","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45993042","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45992231","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN"},{"cep":"45993126","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990872","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45991094","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45989124","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45994242","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45985142","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45989226","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45988511","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45985019","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45994354","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45987566","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45989228","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45985152","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45992279","cidade":"TEIXEIRA DE FREITAS","bairro":"UNIVERSITÁRIO"},{"cep":"45994202","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL RAMALHO"},{"cep":"45990033","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45994824","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45985224","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45989194","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45992534","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45987164","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45989198","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45985164","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990096","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45992396","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45990476","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45994057","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45987172","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45991030","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 3"},{"cep":"45991066","cidade":"TEIXEIRA DE FREITAS","bairro":"BONADIMAN"},{"cep":"45985054","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45989258","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45990450","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45989070","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45989106","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45986108","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45993350","cidade":"TEIXEIRA DE FREITAS","bairro":"ARCO VERDE"},{"cep":"45985398","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45991172","cidade":"TEIXEIRA DE FREITAS","bairro":"PORTAL SUL"},{"cep":"45989395","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45989094","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45990442","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45994072","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45987008","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45990832","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45989280","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45991024","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 2"},{"cep":"45993338","cidade":"TEIXEIRA DE FREITAS","bairro":"ARCO VERDE"},{"cep":"45989176","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45990632","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45985011","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45993015","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45990602","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45985639","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985711","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985378","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985369","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45991184","cidade":"TEIXEIRA DE FREITAS","bairro":"PORTAL SUL"},{"cep":"45990726","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45994123","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985420","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45994236","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994655","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45990762","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45985580","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45993123","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45989178","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45993404","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45993027","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VARGAS"},{"cep":"45987222","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM EUROPA"},{"cep":"45989180","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989252","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45989212","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45992378","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45990734","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45985428","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45987760","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45989153","cidade":"TEIXEIRA DE FREITAS","bairro":"JERUSALÉM"},{"cep":"45989256","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45987074","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVO HORIZONTE"},{"cep":"45987116","cidade":"TEIXEIRA DE FREITAS","bairro":"RECANTO DO LAGO"},{"cep":"45994351","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45993189","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45985206","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45987776","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45987252","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM EUROPA"},{"cep":"45985648","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45994743","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45985906","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45992402","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45985604","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45985230","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45990223","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45992582","cidade":"TEIXEIRA DE FREITAS","bairro":"KAIKAN SUL"},{"cep":"45990271","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990382","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45987288","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45992408","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45988178","cidade":"TEIXEIRA DE FREITAS","bairro":"MIRANTE DO RIO"},{"cep":"45994390","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45987336","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45994185","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45987428","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45988620","cidade":"TEIXEIRA DE FREITAS","bairro":"CAMINHO DO MAR 2"},{"cep":"45985282","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45988478","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45993329","cidade":"TEIXEIRA DE FREITAS","bairro":"ARCO VERDE"},{"cep":"45986382","cidade":"TEIXEIRA DE FREITAS","bairro":"SETOR BAHIA SUL"},{"cep":"45989377","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45987632","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45994066","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985174","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45992414","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 2"},{"cep":"45985633","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45987304","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45985595","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45989067","cidade":"TEIXEIRA DE FREITAS","bairro":"CASTELINHO"},{"cep":"45991168","cidade":"TEIXEIRA DE FREITAS","bairro":"PORTAL SUL"},{"cep":"45995330","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL TERRAS DA BAHIA"},{"cep":"45994865","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994192","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994333","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994734","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994800","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994166","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994399","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994170","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994360","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994230","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994027","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994862","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994752","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994680","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994051","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994719","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994081","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994274","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994093","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994168","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994015","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994206","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994194","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994384","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994330","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994117","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994084","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994158","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994648","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45994294","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994172","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994138","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994336","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994871","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994670","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45994164","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994686","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994200","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA TEIXEIRA"},{"cep":"45994003","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45994859","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994234","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994856","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45994746","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994357","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994770","cidade":"TEIXEIRA DE FREITAS","bairro":"ULISSES GUIMARÃES"},{"cep":"45994372","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45994649","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA CANAÃ"},{"cep":"45990903","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990502","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990778","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990352","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45990790","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990756","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990510","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990626","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990712","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990366","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45990728","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990274","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990238","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990220","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990722","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990668","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45990542","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990792","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990672","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45990304","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990099","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990616","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990776","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990205","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990782","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990322","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990054","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990796","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990718","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990030","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990772","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990172","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990081","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990464","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990484","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990748","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990196","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990720","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990136","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990642","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990006","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990852","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990295","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990166","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990069","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990736","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990848","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990800","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990307","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45990760","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990660","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA VERDE"},{"cep":"45990422","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990408","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990126","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990838","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990556","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990404","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990536","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990624","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45990093","cidade":"TEIXEIRA DE FREITAS","bairro":"MONTE CASTELO"},{"cep":"45990730","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990836","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45990788","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45990370","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA ROSA DE LIMA"},{"cep":"45990518","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990193","cidade":"TEIXEIRA DE FREITAS","bairro":"BELA VISTA"},{"cep":"45985357","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985184","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985172","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985592","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45985238","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985354","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985023","cidade":"TEIXEIRA DE FREITAS","bairro":"TEIXEIRINHA"},{"cep":"45985710","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985642","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985327","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985360","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985684","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985220","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985724","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985315","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985709","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985291","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985681","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985162","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985226","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985636","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985068","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985285","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985657","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985204","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985044","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985092","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985046","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985062","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985404","cidade":"TEIXEIRA DE FREITAS","bairro":"ARUTEF"},{"cep":"45985330","cidade":"TEIXEIRA DE FREITAS","bairro":"SANTA RITA"},{"cep":"45985708","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985076","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985616","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45985042","cidade":"TEIXEIRA DE FREITAS","bairro":"BOM JESUS"},{"cep":"45985232","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985104","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45985705","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45985363","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985110","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45985959","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985048","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985009","cidade":"Teixeira de Freitas","bairro":"TEIXEIRINHA"},{"cep":"45985321","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985907","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987758","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45992342","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987196","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987708","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992285","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988548","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987628","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL ANTONIO COSTA FILHO"},{"cep":"45989266","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA JERUSALÉM"},{"cep":"45992117","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45989497","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45992270","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45986004","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45988600","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45989184","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45992678","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45993392","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45991102","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45987770","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE"},{"cep":"45989159","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL RAMALHO"},{"cep":"45989103","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45988347","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA FELIZ"},{"cep":"45987774","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993410","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45992243","cidade":"Teixeira de Freitas","bairro":"KAIKAN"},{"cep":"45993173","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45993467","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45993087","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992333","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45989201","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993063","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45986024","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45986044","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45992526","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988499","cidade":"Teixeira de Freitas","bairro":"NOVA AMÉRICA"},{"cep":"45987742","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987234","cidade":"Teixeira de Freitas","bairro":"JARDIM EUROPA"},{"cep":"45987300","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45993277","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45988544","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45989141","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45993132","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989383","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45987768","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45991036","cidade":"Teixeira de Freitas","bairro":"URBIS 3"},{"cep":"45993315","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992177","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45992626","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45993084","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993099","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987228","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987219","cidade":"Teixeira de Freitas","bairro":"JARDIM EUROPA"},{"cep":"45993353","cidade":"Teixeira de Freitas","bairro":"ARCO VERDE"},{"cep":"45987746","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45987004","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986012","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45988490","cidade":"Teixeira de Freitas","bairro":"NOVA AMÉRICA"},{"cep":"45987396","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993264","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45989245","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45989091","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45993326","cidade":"Teixeira de Freitas","bairro":"ARCO VERDE"},{"cep":"45988628","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993156","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989264","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45987152","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992423","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 2"},{"cep":"45992273","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993469","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45987132","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989205","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45993320","cidade":"Teixeira de Freitas","bairro":"ARCO VERDE"},{"cep":"45993198","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45987554","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL SANTOS GUIMARÃES"},{"cep":"45992327","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45989401","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45987420","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45988550","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988576","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45992288","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45993045","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45988142","cidade":"Teixeira de Freitas","bairro":"MIRANTE DO RIO"},{"cep":"45986060","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45993210","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989066","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992578","cidade":"Teixeira de Freitas","bairro":"KAIKAN SUL"},{"cep":"45989548","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993446","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45987084","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988542","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45992114","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992494","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986350","cidade":"Teixeira de Freitas","bairro":"SETOR BAHIA SUL"},{"cep":"45993470","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45989449","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45989036","cidade":"Teixeira de Freitas","bairro":"IRMÃ DULCE"},{"cep":"45989443","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988508","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987014","cidade":"Teixeira de Freitas","bairro":"WILSON GUIMARÃES"},{"cep":"45993267","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45992162","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45993449","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45988173","cidade":"Teixeira de Freitas","bairro":"MIRANTE DO RIO"},{"cep":"45993332","cidade":"Teixeira de Freitas","bairro":"ARCO VERDE"},{"cep":"45993407","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45991142","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45992318","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45988487","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992522","cidade":"Teixeira de Freitas","bairro":"KAIKAN SUL"},{"cep":"45987000","cidade":"Teixeira de Freitas","bairro":"WILSON GUIMARÃES"},{"cep":"45988463","cidade":"Teixeira de Freitas","bairro":"NOVA AMÉRICA"},{"cep":"45986330","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986056","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993147","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45993102","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45991010","cidade":"Teixeira de Freitas","bairro":"URBIS 2"},{"cep":"45989380","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993039","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45988598","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992662","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45989242","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45988054","cidade":"TEIXEIRA DE FREITAS","bairro":"SÃO JOSÉ"},{"cep":"45989112","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45987188","cidade":"Teixeira de Freitas","bairro":"RECANTO DO LAGO"},{"cep":"45993009","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989200","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45987243","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989174","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45992614","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992072","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45992081","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45988582","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992084","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992558","cidade":"Teixeira de Freitas","bairro":"KAIKAN SUL"},{"cep":"45992165","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986036","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45992363","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 2"},{"cep":"45988552","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45993066","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45993096","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45988526","cidade":"Teixeira de Freitas","bairro":"NOVA AMÉRICA"},{"cep":"45988592","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45987432","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45987582","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45989097","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45992030","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992291","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45988102","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989088","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45992201","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45993021","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45987010","cidade":"Teixeira de Freitas","bairro":"WILSON GUIMARÃES"},{"cep":"45991153","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991114","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987634","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987412","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992369","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987320","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45987624","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL ANTONIO COSTA FILHO"},{"cep":"45989240","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45989220","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45986084","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45991196","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993356","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989232","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45989161","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993150","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45992249","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993398","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45991164","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45988578","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45993313","cidade":"Teixeira de Freitas","bairro":"ALTO DO TANCREDO"},{"cep":"45988567","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45987584","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987440","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993383","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45992075","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45986008","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45993310","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989278","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989440","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45986358","cidade":"Teixeira de Freitas","bairro":"SETOR BAHIA SUL"},{"cep":"45975000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988638","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985651","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994661","cidade":"Teixeira de Freitas","bairro":"NOVA CANAÃ"},{"cep":"45993280","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992306","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45994069","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45993347","cidade":"Teixeira de Freitas","bairro":"ARCO VERDE"},{"cep":"45987752","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985729","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985402","cidade":"Teixeira de Freitas","bairro":"ARUTEF"},{"cep":"45988622","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR 2"},{"cep":"45987416","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45990770","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45992222","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988532","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985900","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45989012","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987012","cidade":"TEIXEIRA DE FREITAS","bairro":"WILSON GUIMARÃES"},{"cep":"45992610","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985078","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992618","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45989491","cidade":"TEIXEIRA DE FREITAS","bairro":"NANUQUE"},{"cep":"45990169","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990256","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45988166","cidade":"Teixeira de Freitas","bairro":"MIRANTE DO RIO"},{"cep":"45985096","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45985687","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989024","cidade":"Teixeira de Freitas","bairro":"IRMÃ DULCE"},{"cep":"45985064","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987424","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45992312","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994156","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45993464","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45987730","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985672","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985622","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45988118","cidade":"Teixeira de Freitas","bairro":"SÃO JOSÉ"},{"cep":"45993298","cidade":"Teixeira de Freitas","bairro":"ALTO DO TANCREDO"},{"cep":"45990042","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994758","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990253","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987560","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993258","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985312","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45988153","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993240","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45985138","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992210","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985712","cidade":"Teixeira de Freitas","bairro":"OURO VERDE"},{"cep":"45987754","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45985100","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990552","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990610","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993304","cidade":"Teixeira de Freitas","bairro":"ALTO DO TANCREDO"},{"cep":"45993078","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45985276","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45987213","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987766","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992590","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45990544","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993323","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993072","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985166","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992282","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992622","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45989133","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992123","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45985056","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994806","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994105","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45993172","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987080","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992024","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45992654","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45992646","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45985202","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45990133","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990901","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994024","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45990142","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45989136","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45989494","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991082","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45994755","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987068","cidade":"Teixeira de Freitas","bairro":"NOVO HORIZONTE"},{"cep":"45990574","cidade":"Teixeira de Freitas","bairro":"VILA CARAIPE"},{"cep":"45994827","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993120","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994692","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45992330","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45990532","cidade":"Teixeira de Freitas","bairro":"VILA CARAIPE"},{"cep":"45989236","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45989190","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985416","cidade":"Teixeira de Freitas","bairro":"ARUTEF"},{"cep":"45985136","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45990105","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45993216","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990578","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989127","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45993090","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45985390","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994060","cidade":"TEIXEIRA DE FREITAS","bairro":"REDENÇÃO"},{"cep":"45985714","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"},{"cep":"45994387","cidade":"Teixeira de Freitas","bairro":"JARDIM LIBERDADE"},{"cep":"45986048","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45991156","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990229","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45994698","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993003","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989222","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987237","cidade":"Teixeira de Freitas","bairro":"JARDIM EUROPA"},{"cep":"45992051","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45992574","cidade":"Teixeira de Freitas","bairro":"KAIKAN SUL"},{"cep":"45992087","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988148","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993370","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993069","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45987140","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM PLANALTO"},{"cep":"45995051","cidade":"TEIXEIRA DE FREITAS","bairro":"CENTRO"},{"cep":"45988082","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985339","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45990454","cidade":"Teixeira de Freitas","bairro":"VILA CARAIPE"},{"cep":"45994689","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45985150","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45990482","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990716","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987076","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994150","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989389","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987344","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45905000","cidade":"CARAVELAS","bairro":""},{"cep":"45990744","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985112","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45985586","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45985306","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45987480","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987128","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989446","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988146","cidade":"Teixeira de Freitas","bairro":"MIRANTE DO RIO"},{"cep":"45992276","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45991090","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45985607","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990187","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990380","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985094","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45993416","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45988066","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990768","cidade":"Teixeira de Freitas","bairro":"JARDIM CARAÍPE"},{"cep":"45987380","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45992411","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 2"},{"cep":"45990051","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992048","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987570","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45993207","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45986336","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989043","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989425","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987216","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985234","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45992186","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989214","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45990057","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45990636","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992348","cidade":"Teixeira de Freitas","bairro":"UNIVERSITÁRIO"},{"cep":"45990888","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994250","cidade":"Teixeira de Freitas","bairro":"NOVA TEIXEIRA"},{"cep":"45985400","cidade":"Teixeira de Freitas","bairro":"ARUTEF"},{"cep":"45986208","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992502","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989076","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45985351","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45988158","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995328","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994735","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45838500","cidade":"JUCURUÇU","bairro":"NOVA ALEGRIA"},{"cep":"45987736","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE (MONT SERRAT 2)"},{"cep":"45993473","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45990072","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991058","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45989196","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45993178","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991188","cidade":"Teixeira de Freitas","bairro":"PORTAL SUL"},{"cep":"45985693","cidade":"Teixeira de Freitas","bairro":"OURO VERDE"},{"cep":"45990356","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991078","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45986080","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987772","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992435","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989230","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987588","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990900","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990024","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45985208","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45991122","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985001","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989149","cidade":"Teixeira de Freitas","bairro":"CASTELINHO"},{"cep":"45992240","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45994378","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990648","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991070","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45987225","cidade":"Teixeira de Freitas","bairro":"JARDIM EUROPA"},{"cep":"45990157","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45989238","cidade":"Teixeira de Freitas","bairro":"NOVA JERUSALÉM"},{"cep":"45985345","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45839000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988580","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45995326","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988574","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR"},{"cep":"45994021","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990360","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991042","cidade":"Teixeira de Freitas","bairro":"URBIS 3"},{"cep":"45993316","cidade":"Teixeira de Freitas","bairro":"ALTO DO TANCREDO"},{"cep":"45992682","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45987732","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988130","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988344","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993204","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990780","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45992003","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45990087","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45992586","cidade":"Teixeira de Freitas","bairro":"KAIKAN SUL"},{"cep":"45988523","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988160","cidade":"Teixeira de Freitas","bairro":"MIRANTE DO RIO"},{"cep":"45988610","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR 2"},{"cep":"45990520","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986386","cidade":"Teixeira de Freitas","bairro":"SETOR BAHIA SUL"},{"cep":"45993389","cidade":"TEIXEIRA DE FREITAS","bairro":"LIBERDADE 1"},{"cep":"45992360","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985645","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45995342","cidade":"TEIXEIRA DE FREITAS","bairro":"EIXO SUL"},{"cep":"45990850","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995346","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987020","cidade":"Teixeira de Freitas","bairro":"WILSON GUIMARÃES"},{"cep":"45992255","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990548","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988140","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992315","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985725","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994366","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985240","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990400","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994232","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45985619","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45985082","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992339","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989151","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987716","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE (MONT SERRAT 3)"},{"cep":"45985583","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL DOS PIONEIROS"},{"cep":"45987332","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45985058","cidade":"Teixeira de Freitas","bairro":"BOM JESUS"},{"cep":"45992506","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994126","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45994135","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45994809","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990416","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994087","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993472","cidade":"Teixeira de Freitas","bairro":"LIBERDADE SUL"},{"cep":"45990630","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992042","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45995061","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994821","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45985242","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994218","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992228","cidade":"Teixeira de Freitas","bairro":"KAIKAN"},{"cep":"45992018","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992690","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988618","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR 2"},{"cep":"45993202","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988646","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990904","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995336","cidade":"Teixeira de Freitas","bairro":"RESIDENCIAL TERRAS DA BAHIA"},{"cep":"45985613","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45938000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989584","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994244","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45992192","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45996899","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993159","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987468","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989122","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991012","cidade":"Teixeira de Freitas","bairro":"URBIS 2"},{"cep":"45993452","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45992658","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988172","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991155","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990123","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994812","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993093","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994767","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45992020","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985168","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990738","cidade":"Teixeira de Freitas","bairro":"JARDIM CARAÍPE"},{"cep":"45990075","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987006","cidade":"Teixeira de Freitas","bairro":"WILSON GUIMARÃES"},{"cep":"45990670","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990376","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989073","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987404","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45986092","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987100","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985176","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989502","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994196","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45993057","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990015","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985003","cidade":"Teixeira de Freitas","bairro":"CIDADE DE DEUS 1"},{"cep":"45987192","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986334","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992518","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993075","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45987762","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45994803","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45990470","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985598","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989398","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986374","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985027","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992225","cidade":"Teixeira de Freitas","bairro":"KAIKAN"},{"cep":"45985146","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985318","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987328","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45989186","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985060","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987168","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987276","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991110","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45988900","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985090","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45988632","cidade":"Teixeira de Freitas","bairro":"CAMINHO DO MAR 2"},{"cep":"45992063","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988572","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994701","cidade":"Teixeira de Freitas","bairro":"ULISSES GUIMARÃES"},{"cep":"45986392","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987050","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992594","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990048","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45990490","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985130","cidade":"Teixeira de Freitas","bairro":"CENTRO"},{"cep":"45985721","cidade":"ITANHÉM","bairro":""},{"cep":"45985408","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993362","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993205","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990372","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994818","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994381","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995056","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988168","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990478","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995356","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994874","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988090","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989165","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990036","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991146","cidade":"Teixeira de Freitas","bairro":"BONADIMAN"},{"cep":"45993458","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45990175","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993168","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987756","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE (MONT SERRAT 3)"},{"cep":"45991032","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990460","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994647","cidade":"Teixeira de Freitas","bairro":"NOVA CANAÃ"},{"cep":"45987444","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45935000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988167","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990732","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990021","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45985050","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987065","cidade":"Teixeira de Freitas","bairro":"NOVO HORIZONTE"},{"cep":"45986076","cidade":"Teixeira de Freitas","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45987743","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985732","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985021","cidade":"Teixeira de Freitas","bairro":"TEIXEIRINHA"},{"cep":"45990638","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987745","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994132","cidade":"Teixeira de Freitas","bairro":"REDENÇÃO"},{"cep":"45994208","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45993307","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993030","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990766","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992027","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45989224","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993461","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45991180","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985745","cidade":"Teixeira de Freitas","bairro":"OURO VERDE"},{"cep":"45992252","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990764","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993457","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45995322","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989008","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993230","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993255","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994886","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988078","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990244","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45985052","cidade":"Teixeira de Freitas","bairro":"BOM JESUS"},{"cep":"45987792","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995352","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987062","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987144","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988529","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992234","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985375","cidade":"Teixeira de Freitas","bairro":"SANTA RITA"},{"cep":"45990386","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986346","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992189","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45838000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985702","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992642","cidade":"Teixeira de Freitas","bairro":"ROSA LUXEMBURGO"},{"cep":"45995059","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990866","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990190","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987160","cidade":"Teixeira de Freitas","bairro":"RECANTO DO LAGO"},{"cep":"45985424","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987488","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45987056","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987030","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990163","cidade":"Teixeira de Freitas","bairro":"BELA VISTA"},{"cep":"45993226","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45985120","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987900","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992660","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985392","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990804","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991126","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990364","cidade":"Teixeira de Freitas","bairro":"SANTA ROSA DE LIMA"},{"cep":"45994791","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992156","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990374","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994314","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985719","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988169","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985690","cidade":"Teixeira de Freitas","bairro":"OURO VERDE"},{"cep":"45990277","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986362","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991014","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992686","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993166","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988086","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985005","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989208","cidade":"Teixeira de Freitas","bairro":"JERUSALÉM"},{"cep":"45988586","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990430","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993476","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990628","cidade":"Teixeira de Freitas","bairro":"JARDIM PLANALTO"},{"cep":"45985735","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987200","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988558","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987364","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988062","cidade":"Teixeira de Freitas","bairro":"SÃO JOSÉ"},{"cep":"45994220","cidade":"Teixeira de Freitas","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45990184","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987738","cidade":"Teixeira de Freitas","bairro":"COLINA VERDE"},{"cep":"45993012","cidade":"Teixeira de Freitas","bairro":"VILA VARGAS"},{"cep":"45992510","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995344","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989533","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992033","cidade":"Teixeira de Freitas","bairro":"SÃO LOURENÇO"},{"cep":"45987016","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990492","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988626","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990358","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994154","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988154","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988616","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45986396","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994318","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989282","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992602","cidade":"Teixeira de Freitas","bairro":"EIXO SUL"},{"cep":"45990452","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990060","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990538","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990794","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991154","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990754","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985140","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987272","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985190","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990462","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992309","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987706","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45984000","cidade":"GUARANI","bairro":""},{"cep":"45990496","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993186","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993455","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991160","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993380","cidade":"Teixeira de Freitas","bairro":"LIBERDADE 1"},{"cep":"45990600","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991192","cidade":"Teixeira de Freitas","bairro":"PORTAL SUL"},{"cep":"45988564","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985080","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985713","cidade":"Teixeira de Freitas","bairro":"OURO VERDE"},{"cep":"45990784","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985610","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985905","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985426","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988164","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988350","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989016","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994286","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985144","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992258","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987240","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985908","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990438","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990027","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45990530","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994204","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994182","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988570","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987053","cidade":"Teixeira de Freitas","bairro":"NOVO HORIZONTE"},{"cep":"45987264","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988469","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992237","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989368","cidade":"Teixeira de Freitas","bairro":"NANUQUE"},{"cep":"45988150","cidade":"ITAMARAJU","bairro":""},{"cep":"45986398","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990604","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990488","cidade":"Teixeira de Freitas","bairro":"MONTE CASTELO"},{"cep":"45991050","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988472","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990448","cidade":"Teixeira de Freitas","bairro":"VILA CARAIPE"},{"cep":"45988630","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987713","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994695","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987710","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994396","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985418","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45837000","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990456","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995060","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993196","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990268","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989476","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992444","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992324","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990139","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45834959","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988208","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989419","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993235","cidade":"Teixeira de Freitas","bairro":"TANCREDO NEVES"},{"cep":"45995358","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990580","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992321","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985722","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987246","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45995350","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987622","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994306","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993301","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990181","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992591","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993386","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45992598","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990202","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990874","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988200","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988520","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990390","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990474","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985747","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987798","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45987448","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45993175","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45985715","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45990350","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45994646","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45988612","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45989286","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991200","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45991008","cidade":"Teixeira de Freitas","bairro":""},{"cep":"45920959","cidade":"NOVA VIÇOSA","bairro":""},{"cep":"45990892","cidade":"TEIXEIRA DE FREITAS","bairro":"URBIS 1"},{"cep":"45987715","cidade":"TEIXEIRA DE FREITAS","bairro":"COLINA VERDE (MONT SERRAT 3)"},{"cep":"45988466","cidade":"TEIXEIRA DE FREITAS","bairro":"NOVA AMÉRICA"},{"cep":"45994408","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM LIBERDADE"},{"cep":"45990550","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45990568","cidade":"TEIXEIRA DE FREITAS","bairro":"VILA CARAIPE"},{"cep":"45993192","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45990714","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM CARAÍPE"},{"cep":"45995054","cidade":"TEIXEIRA DE FREITAS","bairro":"JARDIM BEIRA RIO"},{"cep":"45995320","cidade":"TEIXEIRA DE FREITAS","bairro":"RESIDENCIAL TERRAS DA BAHIA"},{"cep":"45986104","cidade":"TEIXEIRA DE FREITAS","bairro":"ESTÂNCIA BIQUINE"},{"cep":"45994198","cidade":"TEIXEIRA DE FREITAS","bairro":"LUÍS EDUARDO MAGALHÃES"},{"cep":"45993174","cidade":"TEIXEIRA DE FREITAS","bairro":"TANCREDO NEVES"},{"cep":"45985749","cidade":"TEIXEIRA DE FREITAS","bairro":"OURO VERDE"}];
  var cepReference = CEP_REFERENCE_INITIAL.map(function (row) { return { cep: onlyDigits(row.cep).padStart(8, '0'), cidade: cleanCell(row.cidade), bairro: cleanCell(row.bairro) }; });
  var cepByNumber = new Map();

  var STORAGE_KEY = 'torre-stucks-plus-base-v1';
  var HISTORY_KEY = 'torre-stucks-plus-history-v1';
  var DAMAGE_STORAGE_KEY = 'torre-stucks-plus-avarias-brs-v1';
  var TREATMENT_STORAGE_KEY = 'torre-stucks-plus-tratativas-brs-v1';
  var TREATMENT_SHEET_URL_KEY = 'torre-stucks-plus-tratativas-local-file-v1';
  var TREATMENT_HANDLE_DB = 'torre-stucks-tratativas-file-db-v2';
  var TREATMENT_HANDLE_STORE = 'handles';
  var TREATMENT_HANDLE_KEY = 'estoque_tratativas_xlsx';
  var SUPABASE_URL_KEY = 'torre-stucks-supabase-url-v2';
  var SUPABASE_ANON_KEY = 'torre-stucks-supabase-anon-key-v2';
  var SUPABASE_PENDING_KEY = 'torre-stucks-supabase-pending-tratativas-v2';
  var supabaseConfig = { url: 'https://xknmhvfueczezhdnqkgq.supabase.co', anonKey: 'sb_publishable_xBwEOwAWLcopYi7akl-fVA_pOf7yFbJ', table: 'stucks_tratativas' };
  var CEP_IMPORT_STORAGE_KEY = 'torre-stucks-plus-cep-import-cache-v1';
  var IMPORT_COMPAT_VERSION = 'stucks-import-tn-status-dias-valor-cidade-entregador-v3';
  var damageShipmentSet = new Set();
  var cepImportCache = new Map();
  var treatmentMap = new Map();
  var treatmentSheetSync = { endpoint: '', fileHandle: null, fileName: '', pending: new Map(), timer: null, busy: false, lastLoadedAt: null, lastSavedAt: null };
  var monitorModalAllRows = [];
  var monitorModalRows = [];
  var monitorModalContext = {};
  var monitorGroupCache = new Map();
  var monitorModalFilters = { status: 'all', city: 'all', neighborhood: 'all', ageing: 'all', driver: 'all', sort: 'default', search: '' };

var MONITOR_DEFS = {
    received: { label: 'Received', title: '📥 Received', statusKeys: ['hubReceived'], rawKeys: ['hubreceived', 'hubreceveid', 'received', 'socreceived', 'socrecebido'] },
    assigned: { label: 'Assigned', title: '🏷️ Assigned', statusKeys: ['hubAssigned'], rawKeys: ['hubassigned', 'assigned'] },
    soclh: { label: 'SOC LH', title: '🚚 SOC LH', statusKeys: ['socLHTransported'], rawKeys: ['soclhtransported', 'soclhtransport', 'soclh', 'soclhtransportado'] },
    onhold: { label: 'OnHold', title: '⛔ OnHold', statusKeys: ['onhold'], rawKeys: ['onhold', 'onhol', 'hold'] }
  };

    var state = {
    rows: [],
    filtered: [],
    fileName: '',
    importedAt: null,
    view: 'dashboard',
    filters: {
      status: 'all',
      city: 'all',
      driver: 'all',
      ageing: 'all',
      priority: 'all',
      avaria: 'all',
      cep: 'all',
      search: '',
      cepSearch: '',
      cepCity: 'all',
      treatmentSearch: ''
    },
    monitor: {
      type: 'received',
      city: 'all',
      neighborhood: 'all',
      ageing: 'all',
      sort: 'desc',
      search: ''
    },
    sort: { key: 'ageing_last_status', dir: 'desc' }
  };

  var els = {};

  document.addEventListener('DOMContentLoaded', safeInit);

  function safeInit() {
    try {
      emergencyBindImportControls();
      init();
      window.STUCKS_BOOT_OK = true;
    } catch (error) {
      console.error('Falha crítica ao iniciar dashboard:', error);
      emergencyBindImportControls();
      emergencyStatus('Erro crítico ao iniciar o dashboard: ' + (error.message || error) + '. Atualize index.html, app.js, styles.css e vendor no GitHub, depois use Ctrl+F5.');
    }
  }

  function emergencyStatus(message) {
    var status = document.getElementById('appStatus');
    if (status) {
      status.textContent = message;
      status.className = 'cloud-status error';
    } else {
      alert(message);
    }
  }

  function emergencyBindImportControls() {
    var pairs = [
      { button: 'importStucksBtn', input: 'fileInput', label: 'STUCKS', handler: function (file) { return importStucksFile(file); } },
      { button: 'importCepBtn', input: 'cepInput', label: 'CEP', handler: function (file) { return importCepFile(file); } }
    ];
    pairs.forEach(function (item) {
      var button = document.getElementById(item.button);
      var input = document.getElementById(item.input);
      if (!button || !input || button.dataset.emergencyBound === '1') return;
      button.dataset.emergencyBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        try {
          input.value = '';
          input.click();
          emergencyStatus('Selecione o arquivo de ' + item.label + ' para importar.');
        } catch (error) {
          emergencyStatus('O navegador bloqueou a seleção de arquivo: ' + (error.message || error));
        }
      }, true);
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return emergencyStatus('Nenhum arquivo selecionado para ' + item.label + '.');
        emergencyStatus('Arquivo selecionado: ' + file.name + '. Lendo...');
        try {
          var result = item.handler(file);
          Promise.resolve(result).catch(function (error) {
            emergencyStatus('Erro ao importar ' + item.label + ': ' + (error.message || error));
          });
        } catch (error) {
          emergencyStatus('Erro ao iniciar importação de ' + item.label + ': ' + (error.message || error));
        }
      }, true);
    });
  }

  function init() {
    rebuildCepIndex();
    cacheElements();
    loadDamageList();
    loadTreatmentMap();
    loadCepImportCache();
    loadTreatmentSheetConfig();
    bindEvents();
    createIcons();
    hardenGitHubPagesLayout();
    verifyImportControls();
    populateCepCityFilter();
    renderEmpty();
    renderCepReference();
    renderTreatmentsPage();
    refreshTreatmentsFromSheet({ silent: true }).then(function (count) {
      if (!state.rows.length && count) {
        setStatus('Tratativas importadas da nuvem: ' + count + ' BR(s). Agora importe a base STUCKS do dia para cruzar e preencher automaticamente.', 'ok');
      }
    });
    window.addEventListener('beforeunload', function () { persistTreatmentMap(); persistCurrentBaseSilent(); flushTreatmentSheetQueue({ silent: true }); });
    if (!restoreLocalBackupOnStart()) setStatus('Dashboard vazio. Base CEP fixa carregada com ' + cepReference.length + ' registros. Importe a STUCKS para começar.', 'warn');
  }

  function cacheElements() {
    els.viewTitle = document.getElementById('viewTitle');
    els.appStatus = document.getElementById('appStatus');
    els.emptyState = document.getElementById('emptyState');
    els.fileInput = document.getElementById('fileInput');
    els.cepInput = document.getElementById('cepInput');
    els.importStucksBtn = document.getElementById('importStucksBtn');
    els.importCepBtn = document.getElementById('importCepBtn');
    els.dropZone = document.getElementById('dropZone');
    els.cepDropZone = document.getElementById('cepDropZone');
    els.filterBar = document.getElementById('filterBar');
    els.statusFilter = document.getElementById('statusFilter');
    els.cityFilter = document.getElementById('cityFilter');
    els.driverFilter = document.getElementById('driverFilter');
    els.ageingFilter = document.getElementById('ageingFilter');
    els.priorityFilter = document.getElementById('priorityFilter');
    els.avariaFilter = document.getElementById('avariaFilter');
    els.cepFilter = document.getElementById('cepFilter');
    els.searchInput = document.getElementById('searchInput');
    els.kpis = document.getElementById('kpis');
    els.priorityList = document.getElementById('priorityList');
    els.cityRadar = document.getElementById('cityRadar');
    els.statusTable = document.getElementById('statusTable');
    els.statusFullTable = document.getElementById('statusFullTable');
    els.driversMiniTable = document.getElementById('driversMiniTable');
    els.baseTable = document.getElementById('baseTable');
    els.citiesTable = document.getElementById('citiesTable');
    els.driversTable = document.getElementById('driversTable');
    els.cepTable = document.getElementById('cepTable');
    els.cepSearchInput = document.getElementById('cepSearchInput');
    els.cepCityFilter = document.getElementById('cepCityFilter');
    els.cepStatus = document.getElementById('cepStatus');
    els.damageSingleInput = document.getElementById('damageSingleInput');
    els.damageShipmentInput = document.getElementById('damageShipmentInput');
    els.damageNoteInput = document.getElementById('damageNoteInput');
    els.applyDamageBtn = document.getElementById('applyDamageBtn');
    els.clearDamageBtn = document.getElementById('clearDamageBtn');
    els.exportDamagesBtn = document.getElementById('exportDamagesBtn');
    els.damageListCount = document.getElementById('damageListCount');
    els.damageMatchedCount = document.getElementById('damageMatchedCount');
    els.damageUnmatchedCount = document.getElementById('damageUnmatchedCount');
    els.damageDashboardCount = document.getElementById('damageDashboardCount');
    els.damageBadge = document.getElementById('damageBadge');
    els.damageLookupCep = document.getElementById('damageLookupCep');
    els.damageLookupCity = document.getElementById('damageLookupCity');
    els.damageLookupNeighborhood = document.getElementById('damageLookupNeighborhood');
    els.damageTable = document.getElementById('damageTable');
    els.treatmentBadge = document.getElementById('treatmentBadge');
    els.treatmentStatus = document.getElementById('treatmentStatus');
    els.importTreatmentsInput = document.getElementById('importTreatmentsInput');
    els.exportTreatmentsBtn = document.getElementById('exportTreatmentsBtn');
    els.clearTreatmentsBtn = document.getElementById('clearTreatmentsBtn');
    els.treatmentSingleInput = document.getElementById('treatmentSingleInput');
    els.treatmentSingleText = document.getElementById('treatmentSingleText');
    els.saveSingleTreatmentBtn = document.getElementById('saveSingleTreatmentBtn');
    els.treatmentSearchInput = document.getElementById('treatmentSearchInput');
    els.treatmentsTable = document.getElementById('treatmentsTable');
    els.treatmentSavedCount = document.getElementById('treatmentSavedCount');
    els.treatmentMatchedCount = document.getElementById('treatmentMatchedCount');
    els.treatmentUnmatchedCount = document.getElementById('treatmentUnmatchedCount');
    els.treatmentVisibleCount = document.getElementById('treatmentVisibleCount');
    els.treatmentSheetUrlInput = document.getElementById('treatmentSheetUrlInput');
    els.treatmentSupabaseKeyInput = document.getElementById('treatmentSupabaseKeyInput');
    els.saveSheetConfigBtn = document.getElementById('saveSheetConfigBtn');
    els.syncSheetTreatmentsBtn = document.getElementById('syncSheetTreatmentsBtn');
    els.loadSheetTreatmentsBtn = document.getElementById('loadSheetTreatmentsBtn');
    els.treatmentSheetStatus = document.getElementById('treatmentSheetStatus');
    els.historyTable = document.getElementById('historyTable');
    els.rowCount = document.getElementById('rowCount');
    els.baseBadge = document.getElementById('baseBadge');
    els.historyBadge = document.getElementById('historyBadge');
    els.lastUpdate = document.getElementById('lastUpdate');
    els.criticalRing = document.getElementById('criticalRing');
    els.criticalPct = document.getElementById('criticalPct');
    els.criticalTitle = document.getElementById('criticalTitle');
    els.criticalText = document.getElementById('criticalText');
    els.driverRing = document.getElementById('driverRing');
    els.driverPct = document.getElementById('driverPct');
    els.driverTitle = document.getElementById('driverTitle');
    els.driverText = document.getElementById('driverText');
    els.insightsList = document.getElementById('insightsList');
    els.activeFilters = document.getElementById('activeFilters');
    els.monitorToggle = document.getElementById('monitorToggle');
    els.monitorMenu = document.getElementById('monitorMenu');
    els.monitorCityFilter = document.getElementById('monitorCityFilter');
    els.monitorNeighborhoodFilter = document.getElementById('monitorNeighborhoodFilter');
    els.monitorAgeingFilter = document.getElementById('monitorAgeingFilter');
    els.monitorSortFilter = document.getElementById('monitorSortFilter');
    els.monitorSearchInput = document.getElementById('monitorSearchInput');
    els.monitorSearchResults = document.getElementById('monitorSearchResults');
    els.monitorModal = document.getElementById('monitorModal');
    els.monitorModalTitle = document.getElementById('monitorModalTitle');
    els.monitorModalSubtitle = document.getElementById('monitorModalSubtitle');
    els.monitorDetailStatusFilter = document.getElementById('monitorDetailStatusFilter');
    els.monitorDetailCityFilter = document.getElementById('monitorDetailCityFilter');
    els.monitorDetailNeighborhoodFilter = document.getElementById('monitorDetailNeighborhoodFilter');
    els.monitorDetailAgeingFilter = document.getElementById('monitorDetailAgeingFilter');
    els.monitorDetailDriverFilter = document.getElementById('monitorDetailDriverFilter');
    els.monitorDetailSortFilter = document.getElementById('monitorDetailSortFilter');
    els.monitorDetailSearchInput = document.getElementById('monitorDetailSearchInput');
    els.monitorDetailClearFiltersBtn = document.getElementById('monitorDetailClearFiltersBtn');
    els.monitorModalTable = document.getElementById('monitorModalTable');
    els.monitorModalCloseBtn = document.getElementById('monitorModalCloseBtn');
    els.monitorModalCopyBtn = document.getElementById('monitorModalCopyBtn');
    els.monitorModalExportBtn = document.getElementById('monitorModalExportBtn');
    els.monitorSaveTreatmentsBtn = document.getElementById('monitorSaveTreatmentsBtn');
    els.monitorTotalNote = document.getElementById('monitorTotalNote');
    els.monitorSummaryTitle = document.getElementById('monitorSummaryTitle');
    els.monitorSummaryTable = document.getElementById('monitorSummaryTable');
  }

  function bindEvents() {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.dataset.monitorStatus) {
          setMonitorStatus(button.dataset.monitorStatus);
          return;
        }
        setView(button.dataset.view);
      });
    });
    if (els.monitorToggle) {
      els.monitorToggle.addEventListener('click', function () {
        var open = !els.monitorMenu.classList.contains('open');
        els.monitorMenu.classList.toggle('open', open);
        els.monitorToggle.classList.toggle('open', open);
        els.monitorToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    document.querySelectorAll('[data-view-jump]').forEach(function (button) {
      button.addEventListener('click', function () { setView(button.dataset.viewJump); });
    });

    bindFilePicker(els.fileInput, importStucksFile, 'STUCKS');
    bindFilePicker(els.cepInput, importCepFile, 'CEP');
    bindImportButton(els.importStucksBtn, els.fileInput, 'STUCKS');
    bindImportButton(els.importCepBtn, els.cepInput, 'CEP');
    bindDropZone(els.dropZone || els.importStucksBtn, importStucksFile);
    bindDropZone(els.cepDropZone || els.importCepBtn, importCepFile);

    if (els.statusFilter) els.statusFilter.addEventListener('change', function () { state.filters.status = els.statusFilter.value; applyAndRender(); });
    if (els.cityFilter) els.cityFilter.addEventListener('change', function () { state.filters.city = els.cityFilter.value; applyAndRender(); });
    if (els.driverFilter) els.driverFilter.addEventListener('change', function () { state.filters.driver = els.driverFilter.value; applyAndRender(); });
    if (els.ageingFilter) els.ageingFilter.addEventListener('change', function () { state.filters.ageing = els.ageingFilter.value; applyAndRender(); });
    if (els.priorityFilter) els.priorityFilter.addEventListener('change', function () { state.filters.priority = els.priorityFilter.value; applyAndRender(); });
    if (els.avariaFilter) els.avariaFilter.addEventListener('change', function () { state.filters.avaria = els.avariaFilter.value; applyAndRender(); });
    if (els.cepFilter) els.cepFilter.addEventListener('change', function () { state.filters.cep = els.cepFilter.value; applyAndRender(); });
    if (els.searchInput) els.searchInput.addEventListener('input', debounce(function () { state.filters.search = els.searchInput.value.trim(); applyAndRender(); }, 120));
    if (els.cepSearchInput) els.cepSearchInput.addEventListener('input', debounce(function () { state.filters.cepSearch = els.cepSearchInput.value.trim(); renderCepReference(); }, 120));
    if (els.cepCityFilter) els.cepCityFilter.addEventListener('change', function () { state.filters.cepCity = els.cepCityFilter.value; renderCepReference(); });
    if (els.monitorCityFilter) els.monitorCityFilter.addEventListener('change', function () { state.monitor.city = els.monitorCityFilter.value; populateMonitorFilters(); renderMonitoring(); });
    if (els.monitorNeighborhoodFilter) els.monitorNeighborhoodFilter.addEventListener('change', function () { state.monitor.neighborhood = els.monitorNeighborhoodFilter.value; renderMonitoring(); });
    if (els.monitorAgeingFilter) els.monitorAgeingFilter.addEventListener('change', function () { state.monitor.ageing = els.monitorAgeingFilter.value; renderMonitoring(); });
    if (els.monitorSortFilter) els.monitorSortFilter.addEventListener('change', function () { state.monitor.sort = els.monitorSortFilter.value; renderMonitoring(); });
    if (els.monitorSearchInput) els.monitorSearchInput.addEventListener('input', debounce(function () { state.monitor.search = els.monitorSearchInput.value.trim(); renderMonitoring(); }, 120));
    if (els.monitorModalCloseBtn) els.monitorModalCloseBtn.addEventListener('click', closeMonitorModal);
    if (els.monitorDetailStatusFilter) els.monitorDetailStatusFilter.addEventListener('change', function () { monitorModalFilters.status = els.monitorDetailStatusFilter.value; populateMonitorModalFilters(); renderMonitorModalTable(); });
    if (els.monitorDetailCityFilter) els.monitorDetailCityFilter.addEventListener('change', function () { monitorModalFilters.city = els.monitorDetailCityFilter.value; populateMonitorModalFilters(); renderMonitorModalTable(); });
    if (els.monitorDetailNeighborhoodFilter) els.monitorDetailNeighborhoodFilter.addEventListener('change', function () { monitorModalFilters.neighborhood = els.monitorDetailNeighborhoodFilter.value; populateMonitorModalFilters(); renderMonitorModalTable(); });
    if (els.monitorDetailAgeingFilter) els.monitorDetailAgeingFilter.addEventListener('change', function () { monitorModalFilters.ageing = els.monitorDetailAgeingFilter.value; renderMonitorModalTable(); });
    if (els.monitorDetailDriverFilter) els.monitorDetailDriverFilter.addEventListener('change', function () { monitorModalFilters.driver = els.monitorDetailDriverFilter.value; populateMonitorModalFilters(); renderMonitorModalTable(); });
    if (els.monitorDetailSortFilter) els.monitorDetailSortFilter.addEventListener('change', function () { monitorModalFilters.sort = els.monitorDetailSortFilter.value; renderMonitorModalTable(); });
    if (els.monitorDetailSearchInput) els.monitorDetailSearchInput.addEventListener('input', debounce(function () { monitorModalFilters.search = els.monitorDetailSearchInput.value.trim(); renderMonitorModalTable(); }, 100));
    if (els.monitorDetailClearFiltersBtn) els.monitorDetailClearFiltersBtn.addEventListener('click', clearMonitorModalFilters);
    if (els.monitorSaveTreatmentsBtn) els.monitorSaveTreatmentsBtn.addEventListener('click', saveMonitorModalTreatments);
    if (els.monitorModalCopyBtn) els.monitorModalCopyBtn.addEventListener('click', copyMonitorModalBRs);
    if (els.monitorModalExportBtn) els.monitorModalExportBtn.addEventListener('click', exportMonitorModalRows);
    document.addEventListener('click', function (event) {
      if (!event.target || !event.target.closest) return;
      var groupButton = event.target.closest('[data-open-monitor-group]');
      if (groupButton) {
        event.preventDefault();
        event.stopPropagation();
        try {
          var group = monitorGroupCache.get(groupButton.dataset.openMonitorGroup || '');
          if (!group) throw new Error('Grupo não encontrado no cache atual.');
          openMonitorDetailsFromRows(group.payload, group.rows);
        } catch (error) {
          console.error('Erro ao abrir grupo do monitoramento:', error);
          setStatus('Não foi possível abrir este grupo. Atualize a tabela do monitoramento e tente novamente.', 'error');
        }
        return;
      }
      var button = event.target.closest('[data-open-monitor]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        openMonitorDetails(JSON.parse(button.dataset.openMonitor || '{}'));
      } catch (error) {
        console.error('Erro ao abrir detalhes do monitoramento:', error);
        setStatus('Não foi possível abrir os detalhes dessa BR. Reimporte a base e tente novamente.', 'error');
      }
    });
    if (els.applyDamageBtn) els.applyDamageBtn.addEventListener('click', applyDamageListFromInput);
    if (els.clearDamageBtn) els.clearDamageBtn.addEventListener('click', clearDamageList);
    if (els.exportDamagesBtn) els.exportDamagesBtn.addEventListener('click', function () { exportRows(damageRowsForExport(), 'avarias_cadastradas.xlsx'); });
    if (els.damageShipmentInput) els.damageShipmentInput.addEventListener('input', debounce(updateDamageSidebar, 120));
    if (els.damageSingleInput) els.damageSingleInput.addEventListener('input', debounce(function () { updateDamageSidebar(); renderDamageLookup(); }, 120));
    if (els.importTreatmentsInput) bindFilePicker(els.importTreatmentsInput, importTreatmentsFile);
    if (els.exportTreatmentsBtn) els.exportTreatmentsBtn.addEventListener('click', exportTreatmentsWorkbook);
    if (els.clearTreatmentsBtn) els.clearTreatmentsBtn.addEventListener('click', clearTreatmentMap);
    if (els.saveSheetConfigBtn) els.saveSheetConfigBtn.addEventListener('click', saveTreatmentSheetConfig);
    if (els.syncSheetTreatmentsBtn) els.syncSheetTreatmentsBtn.addEventListener('click', function () { flushTreatmentSheetQueue({ forceAll: true, promptIfMissing: true, downloadIfNoHandle: true }); });
    if (els.loadSheetTreatmentsBtn) els.loadSheetTreatmentsBtn.addEventListener('click', function () { refreshTreatmentsFromSheet({ silent: false }); });
    if (els.saveSingleTreatmentBtn) els.saveSingleTreatmentBtn.addEventListener('click', saveSingleTreatmentFromForm);
    if (els.treatmentSearchInput) els.treatmentSearchInput.addEventListener('input', debounce(function () { state.filters.treatmentSearch = els.treatmentSearchInput.value.trim(); renderTreatmentsPage(); }, 120));

    document.querySelectorAll('[data-quick-filter]').forEach(function (button) {
      button.addEventListener('click', function () { quickFilter(button.dataset.quickFilter); });
    });

    var resetFiltersButton = document.getElementById('resetFiltersBtn'); if (resetFiltersButton) resetFiltersButton.addEventListener('click', resetFilters);
    var exportButton = document.getElementById('exportBtn'); if (exportButton) exportButton.addEventListener('click', function () { exportRows(state.filtered, 'stucks_filtrados.xlsx'); });
    var exportBaseButton = document.getElementById('exportBaseBtn'); if (exportBaseButton) exportBaseButton.addEventListener('click', function () { exportRows(state.filtered, 'base_stucks_filtrada.xlsx'); });
    var exportCitiesButton = document.getElementById('exportCitiesBtn'); if (exportCitiesButton) exportCitiesButton.addEventListener('click', function () { exportRows(groupForExport('buyer_city'), 'stucks_por_cidade.xlsx'); });
    var exportDriversButton = document.getElementById('exportDriversBtn'); if (exportDriversButton) exportDriversButton.addEventListener('click', function () { exportRows(groupForExport('driver_name', 'driver_id'), 'stucks_por_driver.xlsx'); });
    var exportStatusButton = document.getElementById('exportStatusBtn'); if (exportStatusButton) exportStatusButton.addEventListener('click', function () { exportRows(groupForExport('tracking_status'), 'stucks_por_status.xlsx'); });
    var copySummaryButton = document.getElementById('copySummaryBtn'); if (copySummaryButton) copySummaryButton.addEventListener('click', copySummary);
    var saveButton = document.getElementById('saveBtn'); if (saveButton) saveButton.addEventListener('click', saveLocal);
    var loadButton = document.getElementById('loadBtn'); if (loadButton) loadButton.addEventListener('click', loadLocal);
    document.getElementById('clearBtn').addEventListener('click', clearCurrent);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
  }

  function bindFilePicker(input, handler, label) {
    if (!input || !handler) return;
    input.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) {
        setStatus('Nenhum arquivo selecionado para importar ' + (label || '') + '.', 'warn');
        return;
      }
      setStatus('Arquivo selecionado para importar ' + (label || '') + ': ' + file.name, 'warn');
      Promise.resolve(handler(file)).catch(function (error) {
        console.error(error);
        setStatus('Erro ao importar ' + (label || 'arquivo') + ': ' + (error.message || error), 'error');
      }).finally(function () {
        try { event.target.value = ''; } catch (error) {}
      });
    });
  }

  function bindImportButton(button, input, label) {
    if (!button || !input) return;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      try {
        input.value = '';
        input.click();
        setStatus('Selecione a planilha de ' + label + ' para importar.', 'warn');
      } catch (error) {
        console.error(error);
        setStatus('O navegador bloqueou a seleção de arquivo. Tente atualizar a página ou usar Chrome/Edge. Erro: ' + (error.message || error), 'error');
      }
    });
  }

  function bindDropZone(zone, handler) {
    if (!zone || !handler) return;
    ['dragenter', 'dragover'].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        zone.classList.add('dragging');
      });
    });
    ['dragleave', 'drop'].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        zone.classList.remove('dragging');
      });
    });
    zone.addEventListener('drop', function (event) {
      var file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return setStatus('Nenhum arquivo encontrado no arrastar/soltar.', 'warn');
      Promise.resolve(handler(file)).catch(function (error) {
        console.error(error);
        setStatus('Erro ao importar arquivo arrastado: ' + (error.message || error), 'error');
      });
    });
  }

  function createIcons() {
    try {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    } catch (error) {
      console.warn('Ícones externos não carregaram. Usando interface estável com texto/emoji.', error);
    }
  }

  function safeGetStorage(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value == null ? (fallback || '') : value;
    } catch (error) {
      return fallback || '';
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Não foi possível salvar no armazenamento local:', key, error);
      setStatus('Atenção: o navegador não conseguiu salvar tudo localmente. Exporte o Estoque de tratativas como backup.', 'warn');
      return false;
    }
  }

  function safeRemoveStorage(key) {
    try { localStorage.removeItem(key); } catch (error) { console.warn('Não foi possível remover armazenamento local:', key, error); }
  }

  function loadCepImportCache() {
    cepImportCache = new Map();
    try {
      var data = JSON.parse(safeGetStorage(CEP_IMPORT_STORAGE_KEY, '{}') || '{}');
      Object.keys(data || {}).forEach(function (key) {
        var br = normalizeTrace(key);
        var item = data[key] || {};
        if (br) cepImportCache.set(br, { cep: normalizeCep(item.cep), status: cleanCell(item.status) });
      });
    } catch (error) {
      cepImportCache = new Map();
    }
  }

  function persistCepImportCache() {
    var data = {};
    cepImportCache.forEach(function (value, br) {
      if (br) data[br] = { cep: normalizeCep(value.cep), status: cleanCell(value.status) };
    });
    safeSetStorage(CEP_IMPORT_STORAGE_KEY, JSON.stringify(data));
  }

  function loadDamageList() {
    var raw = safeGetStorage(DAMAGE_STORAGE_KEY, '');
    var list = parseDamageShipments(raw);
    damageShipmentSet = new Set(list);
    if (els.damageShipmentInput) els.damageShipmentInput.value = '';
    if (els.damageSingleInput) els.damageSingleInput.value = '';
    updateDamageSidebar();
  }

  function loadTreatmentMap() {
    treatmentMap = new Map();
    try {
      var data = JSON.parse(safeGetStorage(TREATMENT_STORAGE_KEY, '{}') || '{}');
      if (Array.isArray(data)) {
        data.forEach(function (item) {
          var br = normalizeTrace(item.shipment_id || item.BR || item.br);
          var text = cleanCell(item.tratativa || item.TRATATIVA || item.Tratativa || item.texto);
          if (br && text) treatmentMap.set(br, text);
        });
      } else {
        Object.keys(data || {}).forEach(function (key) {
          var br = normalizeTrace(key);
          var raw = data[key];
          var text = cleanCell(typeof raw === 'object' && raw ? (raw.tratativa || raw.texto || raw.value) : raw);
          if (br && text) treatmentMap.set(br, text);
        });
      }
    } catch (error) {
      treatmentMap = new Map();
    }
  }

  function persistTreatmentMap() {
    var data = {};
    treatmentMap.forEach(function (text, br) {
      if (br && cleanCell(text)) data[br] = cleanCell(text);
    });
    safeSetStorage(TREATMENT_STORAGE_KEY, JSON.stringify(data));
    updateTreatmentCounters();
  }

  function persistTreatmentMapAndBase() {
    persistTreatmentMap();
    persistCurrentBaseSilent();
  }

  function loadTreatmentSheetConfig() {
    supabaseConfig.url = 'https://xknmhvfueczezhdnqkgq.supabase.co';
    supabaseConfig.anonKey = 'sb_publishable_xBwEOwAWLcopYi7akl-fVA_pOf7yFbJ';
    safeSetStorage(SUPABASE_URL_KEY, supabaseConfig.url);
    safeSetStorage(SUPABASE_ANON_KEY, supabaseConfig.anonKey);
    loadSupabasePendingQueue();
    if (els.treatmentSheetUrlInput) els.treatmentSheetUrlInput.value = 'Supabase configurado automaticamente';
    if (els.treatmentSupabaseKeyInput) els.treatmentSupabaseKeyInput.value = 'Chave pública configurada automaticamente';
    updateTreatmentSheetStatus('✅ Supabase configurado automaticamente. As tratativas serão salvas na nuvem pela BR.', 'ok');
  }

  async function saveTreatmentSheetConfig() {
    supabaseConfig.url = supabaseConfig.url || 'https://xknmhvfueczezhdnqkgq.supabase.co';
    supabaseConfig.anonKey = supabaseConfig.anonKey || 'sb_publishable_xBwEOwAWLcopYi7akl-fVA_pOf7yFbJ';
    updateTreatmentSheetStatus('Testando conexão fixa com Supabase...', 'warn');
    try {
      await refreshTreatmentsFromSheet({ silent: true });
      await flushTreatmentSheetQueue({ forceAll: true, silent: true });
      updateTreatmentSheetStatus('✅ Supabase conectado. Tratativas sincronizadas e disponíveis em outros PCs.', 'ok');
      setStatus('Supabase conectado como estoque central das tratativas.', 'ok');
    } catch (error) {
      updateTreatmentSheetStatus('Não consegui conectar ao Supabase. Confira tabela, RLS e se o GitHub Pages está atualizado. Erro: ' + (error.message || error), 'error');
    }
  }

  function queueTreatmentSheetSync(br, text) {
    br = normalizeTrace(br);
    if (!br) return;
    treatmentSheetSync.pending.set(br, buildTreatmentRecord(br, text));
    updateTreatmentSheetStatus('Tratativa salva no estoque local. Atualizando backup...', 'warn');
    clearTimeout(treatmentSheetSync.timer);
    treatmentSheetSync.timer = setTimeout(function () { flushTreatmentSheetQueue({ silent: true }); }, 700);
  }

  async function flushTreatmentSheetQueue(options) {
    options = options || {};
    persistTreatmentMap();
    persistCurrentBaseSilent();
    var records = [];
    if (options.forceAll) records = treatmentRowsForWorkbook();
    else records = Array.from(treatmentSheetSync.pending.values());
    if (!records.length && !options.forceAll) {
      if (!options.silent) updateTreatmentSheetStatus('Nada novo para salvar no estoque de tratativas.', 'ok');
      return;
    }
    if (treatmentSheetSync.busy) return;
    treatmentSheetSync.busy = true;
    treatmentSheetSync.pending.clear();
    try {
      var connected = await ensureTreatmentWorkbookForSave({ promptIfMissing: !!options.promptIfMissing });
      if (connected && treatmentSheetSync.fileHandle) {
        await saveTreatmentsToConnectedFile({ silent: true });
        updateTreatmentSheetStatus('Planilha Estoque de tratativas.xlsx salva: ' + treatmentRowsForTable().length + ' BR(s) com tratativa.', 'ok');
      } else {
        if (options.downloadIfNoHandle || !options.silent) {
          downloadTreatmentWorkbook();
          updateTreatmentSheetStatus('Nenhuma planilha foi conectada. Baixei o Estoque de tratativas.xlsx atualizado com ' + treatmentRowsForTable().length + ' BR(s).', 'warn');
        } else {
          updateTreatmentSheetStatus('Tratativas salvas no navegador: ' + treatmentRowsForTable().length + ' BR(s). Conecte a planilha Estoque de tratativas.xlsx para gravar automaticamente no Excel.', 'warn');
        }
      }
    } catch (error) {
      records.forEach(function (record) { treatmentSheetSync.pending.set(record.shipment_id, record); });
      updateTreatmentSheetStatus('Tratativas salvas no navegador, mas não consegui atualizar o Excel. Erro: ' + (error.message || error), 'error');
    } finally {
      treatmentSheetSync.busy = false;
    }
  }

  async function refreshTreatmentsFromSheet(options) {
    options = options || {};
    if (treatmentSheetSync.fileHandle) {
      var count = await loadTreatmentsFromConnectedFile({ silent: !!options.silent });
      if (count) {
        applyTreatmentMapToRows();
        applyAndRender();
      }
      return count;
    }
    if (options.silent) return 0;
    if (els.importTreatmentsInput) {
      els.importTreatmentsInput.value = '';
      els.importTreatmentsInput.click();
      updateTreatmentSheetStatus('Selecione o arquivo Estoque de tratativas.xlsx para carregar as tratativas salvas.', 'warn');
    } else {
      updateTreatmentSheetStatus('Campo de importação do estoque não encontrado.', 'error');
    }
    return 0;
  }

  async function clearTreatmentsFromSheet() {
    if (treatmentSheetSync.fileHandle) {
      try { await saveTreatmentsToConnectedFile({ silent: true }); } catch (error) { console.error(error); }
    }
  }

  function applyTreatmentMapToRows() {
    state.rows.forEach(function (row) {
      if (row._importTratativa == null) row._importTratativa = cleanCell(row.tratativa || '');
      var br = normalizeTrace(row.shipment_id);
      var manual = br ? treatmentMap.get(br) : '';
      row.tratativa = manual || row._importTratativa || cleanCell(row.tratativa || '');
    });
  }

  function setTreatmentForShipment(shipment, text, options) {
    var br = normalizeTrace(shipment);
    if (!br) return;
    var cleanText = cleanCell(text);
    if (cleanText) treatmentMap.set(br, cleanText);
    else treatmentMap.delete(br);
    if (!options || !options.skipSheetSync) queueTreatmentSheetSync(br, cleanText);
  }

  function treatmentRowsForTable() {
    var rowsByBr = new Map();
    state.rows.forEach(function (row) {
      var br = normalizeTrace(row.shipment_id);
      if (br) rowsByBr.set(br, row);
    });
    return Array.from(treatmentMap.entries()).map(function (entry) {
      var br = entry[0];
      var row = rowsByBr.get(br);
      return {
        shipment_id: br,
        tratativa: entry[1],
        encontrado_na_base: row ? 'Sim' : 'Não',
        tracking_status: row ? (row.tracking_status || '') : '',
        cidade: row ? monitorRowCity(row) : '',
        bairro: row ? monitorRowNeighborhood(row) : '',
        driver: row ? (row.driver_name || row.driver_id || '') : '',
        ageing_last_status: row ? (row.ageing_last_status || '') : '',
        avaria: row ? (row.avaria || 'Não') : ''
      };
    }).sort(function (a, b) { return localeSort(a.shipment_id, b.shipment_id); });
  }

  function updateTreatmentCounters() {
    var rows = treatmentRowsForTable();
    var matched = rows.filter(function (row) { return row.encontrado_na_base === 'Sim'; }).length;
    var visible = state.filtered.filter(function (row) { return cleanCell(row.tratativa); }).length;
    if (els.treatmentBadge) {
      els.treatmentBadge.textContent = String(rows.length);
      els.treatmentBadge.classList.toggle('hidden', !rows.length);
    }
    if (els.treatmentSavedCount) els.treatmentSavedCount.textContent = String(rows.length);
    if (els.treatmentMatchedCount) els.treatmentMatchedCount.textContent = String(matched);
    if (els.treatmentUnmatchedCount) els.treatmentUnmatchedCount.textContent = String(Math.max(0, rows.length - matched));
    if (els.treatmentVisibleCount) els.treatmentVisibleCount.textContent = String(visible);
    if (els.treatmentStatus) {
      els.treatmentStatus.textContent = rows.length
        ? rows.length + ' tratativa(s) salva(s). ' + matched + ' encontrada(s) na base atual. Elas serão reaplicadas automaticamente em novas importações pela BR.'
        : 'Nenhuma tratativa salva ainda. Ao preencher uma tratativa por BR, ela será salva automaticamente aqui.';
    }
  }

  function parseDamageShipments(text) {
    var normalized = String(text || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ');
    var parts = normalized.split(/\s+/).map(normalizeTrace).filter(Boolean);
    var seen = new Set();
    var out = [];
    parts.forEach(function (item) {
      if (!item || seen.has(item)) return;
      seen.add(item);
      out.push(item);
    });
    return out;
  }

  function applyDamageListFromInput() {
    var bulk = els.damageShipmentInput ? els.damageShipmentInput.value : '';
    var single = els.damageSingleInput ? els.damageSingleInput.value : '';
    var incoming = parseDamageShipments([single, bulk].join('\n'));
    if (!incoming.length) {
      setStatus('Cole ou digite pelo menos uma BR para adicionar como avaria.', 'warn');
      renderDamageLookup();
      return;
    }
    var note = cleanCell(els.damageNoteInput ? els.damageNoteInput.value : '');
    incoming.forEach(function (item) {
      damageShipmentSet.add(item);
      if (note) setTreatmentForShipment(item, note);
    });
    if (note) persistTreatmentMap();
    var list = Array.from(damageShipmentSet).sort(localeSort);
    safeSetStorage(DAMAGE_STORAGE_KEY, list.join('\n'));
    if (els.damageShipmentInput) els.damageShipmentInput.value = '';
    if (els.damageSingleInput) els.damageSingleInput.value = '';
    if (els.damageNoteInput) els.damageNoteInput.value = '';
    applyDamageListToRows();
    applyTreatmentMapToRows();
    populateFilters();
    applyAndRender();
    var matched = countManualDamagesMatched();
    setStatus('Avarias adicionadas: ' + incoming.length + ' BRs processadas; ' + matched + ' encontradas na base atual.', matched ? 'ok' : 'warn');
  }

  function clearDamageList() {
    damageShipmentSet = new Set();
    safeRemoveStorage(DAMAGE_STORAGE_KEY);
    if (els.damageShipmentInput) els.damageShipmentInput.value = '';
    if (els.damageSingleInput) els.damageSingleInput.value = '';
    if (els.damageNoteInput) els.damageNoteInput.value = '';
    applyDamageListToRows();
    populateFilters();
    applyAndRender();
    setStatus('Lista manual de avarias limpa.', 'warn');
  }

  function applyDamageListToRows() {
    state.rows.forEach(function (row) {
      if (row._importAvaria == null) row._importAvaria = normalizeYesNo(row.avaria);
      var manual = damageShipmentSet.has(normalizeTrace(row.shipment_id));
      row.avaria = manual || row._importAvaria === 'Sim' ? 'Sim' : 'Não';
      enrichRow(row);
    });
    updateDamageSidebar();
  }

  function countManualDamagesMatched() {
    if (!state.rows.length || !damageShipmentSet.size) return 0;
    var matched = 0;
    state.rows.forEach(function (row) {
      if (damageShipmentSet.has(normalizeTrace(row.shipment_id))) matched++;
    });
    return matched;
  }

  function updateDamageSidebar() {
    var previewParts = [];
    if (els.damageSingleInput && els.damageSingleInput.value) previewParts.push(els.damageSingleInput.value);
    if (els.damageShipmentInput && els.damageShipmentInput.value) previewParts.push(els.damageShipmentInput.value);
    var preview = parseDamageShipments(previewParts.join('\n'));
    var saved = damageShipmentSet.size;
    var matched = countManualDamagesMatched();
    var dashboardDamages = state.rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
    var visibleCount = preview.length || saved;
    if (els.damageListCount) els.damageListCount.textContent = String(saved || visibleCount);
    if (els.damageMatchedCount) els.damageMatchedCount.textContent = String(matched);
    if (els.damageUnmatchedCount) els.damageUnmatchedCount.textContent = String(Math.max(0, saved - matched));
    if (els.damageDashboardCount) els.damageDashboardCount.textContent = String(dashboardDamages);
    if (els.damageBadge) {
      els.damageBadge.textContent = String(dashboardDamages || saved);
      els.damageBadge.classList.toggle('hidden', !(dashboardDamages || saved));
    }
    renderDamageLookup();
  }

  function renderDamageLookup() {
    if (!els.damageLookupCep || !els.damageLookupCity || !els.damageLookupNeighborhood) return;
    var br = parseDamageShipments(els.damageSingleInput ? els.damageSingleInput.value : '')[0] || '';
    var row = br ? findRowByShipment(br) : null;
    if (!br) {
      els.damageLookupCep.textContent = 'Digite a BR';
      els.damageLookupCity.textContent = 'Digite a BR';
      els.damageLookupNeighborhood.textContent = 'Digite a BR';
      return;
    }
    if (!row) {
      els.damageLookupCep.textContent = 'Não encontrada na base';
      els.damageLookupCity.textContent = 'Não encontrada na base';
      els.damageLookupNeighborhood.textContent = 'Não encontrada na base';
      return;
    }
    els.damageLookupCep.textContent = row.cep || 'Sem CEP importado';
    els.damageLookupCity.textContent = row.cidade_cep || row.buyer_city || 'Sem cidade';
    els.damageLookupNeighborhood.textContent = row.bairro || 'Sem bairro';
  }

  function findRowByShipment(shipment) {
    var key = normalizeTrace(shipment);
    if (!key) return null;
    return state.rows.find(function (row) { return normalizeTrace(row.shipment_id) === key; }) || null;
  }

  function renderTreatmentsPage() {
    if (!els.treatmentsTable) { updateTreatmentCounters(); return; }
    var query = normalizeSearch(state.filters.treatmentSearch || '');
    var rows = treatmentRowsForTable().filter(function (row) {
      if (!query) return true;
      var haystack = normalizeSearch([row.shipment_id, row.tratativa, row.tracking_status, row.cidade, row.bairro, row.driver].join(' '));
      return haystack.indexOf(query) >= 0;
    });
    updateTreatmentCounters();
    var head = '<thead><tr><th>BR</th><th>Tratativa salva</th><th>Na base atual</th><th>Status</th><th>Cidade</th><th>Bairro</th><th>Driver</th><th>Ageing</th><th>Avaria</th><th>Ação</th></tr></thead>';
    var body = rows.length ? rows.map(function (row) {
      return '<tr>' +
        '<td><strong>' + escapeHtml(row.shipment_id) + '</strong></td>' +
        '<td class="treatment-summary">' + escapeHtml(row.tratativa) + '</td>' +
        '<td>' + yesNoPill(row.encontrado_na_base) + '</td>' +
        '<td>' + escapeHtml(row.tracking_status || '-') + '</td>' +
        '<td>' + escapeHtml(row.cidade || '-') + '</td>' +
        '<td>' + escapeHtml(row.bairro || '-') + '</td>' +
        '<td>' + escapeHtml(row.driver || '-') + '</td>' +
        '<td>' + escapeHtml(row.ageing_last_status || '-') + '</td>' +
        '<td>' + yesNoPill(row.avaria || 'Não') + '</td>' +
        '<td><button class="mini-button" data-remove-treatment="' + escapeAttr(row.shipment_id) + '">Remover</button></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="10">Nenhuma tratativa salva para exibir.</td></tr>';
    els.treatmentsTable.innerHTML = head + '<tbody>' + body + '</tbody>';
    els.treatmentsTable.querySelectorAll('[data-remove-treatment]').forEach(function (button) {
      button.addEventListener('click', function () {
        var br = normalizeTrace(button.dataset.removeTreatment);
        setTreatmentForShipment(br, '');
        state.rows.forEach(function (row) { if (normalizeTrace(row.shipment_id) === br) row.tratativa = row._importTratativa || ''; });
        persistTreatmentMapAndBase();
        applyAndRender();
        setStatus('Tratativa removida da BR ' + br + '.', 'warn');
      });
    });
  }

  async function saveSingleTreatmentFromForm() {
    var br = normalizeTrace(els.treatmentSingleInput && els.treatmentSingleInput.value);
    var text = cleanCell(els.treatmentSingleText && els.treatmentSingleText.value);
    if (!br) return setStatus('Digite a BR para salvar a tratativa.', 'warn');
    if (!text) return setStatus('Digite a tratativa antes de salvar.', 'warn');
    setTreatmentForShipment(br, text);
    state.rows.forEach(function (row) { if (normalizeTrace(row.shipment_id) === br) row.tratativa = text; });
    persistTreatmentMapAndBase();
    applyAndRender();
    await flushTreatmentSheetQueue({ forceAll: true, promptIfMissing: true, downloadIfNoHandle: true });
    if (els.treatmentSingleInput) els.treatmentSingleInput.value = '';
    if (els.treatmentSingleText) els.treatmentSingleText.value = '';
    setStatus('Tratativa salva para a BR ' + br + ' e enviada para o Estoque de tratativas.', 'ok');
  }

  async function importTreatmentsFile(file) {
    try {
      var rows = await parseAnyFileRows(file, 'treatments');
      var count = applyTreatmentsImport(rows);
      persistTreatmentMapAndBase();
      applyAndRender();
      setStatus('Planilha de tratativas importada: ' + count + ' tratativa(s) salva(s)/atualizada(s).', 'ok');
    } catch (error) {
      setStatus('Erro ao importar tratativas: ' + (error.message || 'confira as colunas BR e tratativa.'), 'error');
    }
  }

  function applyTreatmentsImport(rawRows, options) {
    options = options || {};
    if (!rawRows || rawRows.length < 2) throw new Error('A planilha precisa ter cabeçalho e pelo menos uma linha.');
    var headerIndex = findHeaderRowByAliases(rawRows, [FIELD_ALIASES.shipment_id, FIELD_ALIASES.tratativa]);
    var headers = (rawRows[headerIndex] || []).map(cleanCell);
    var map = buildHeaderMap(headers, ['shipment_id', 'tratativa']);
    if (map.shipment_id == null || map.tratativa == null) throw new Error('Não encontrei as colunas BR/shipment_id/TN e tratativa.');
    var count = 0;
    for (var i = headerIndex + 1; i < rawRows.length; i++) {
      var raw = rawRows[i] || [];
      var br = normalizeTrace(raw[map.shipment_id]);
      var text = cleanCell(raw[map.tratativa]);
      if (!br || !text) continue;
      treatmentMap.set(br, text);
      count++;
    }
    applyTreatmentMapToRows();
    return count;
  }

  function exportTreatmentsWorkbook() {
    var rows = treatmentRowsForTable().map(function (row) {
      return {
        shipment_id: row.shipment_id,
        tratativa: row.tratativa,
        encontrado_na_base: row.encontrado_na_base,
        tracking_status: row.tracking_status,
        cidade: row.cidade,
        bairro: row.bairro,
        driver: row.driver,
        ageing_last_status: row.ageing_last_status,
        avaria: row.avaria
      };
    });
    if (!rows.length) return setStatus('Não há tratativas salvas para exportar.', 'warn');
    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'TRATATIVAS');
      XLSX.writeFile(wb, 'Estoque de tratativas.xlsx');
      setStatus('Estoque de tratativas exportado: Estoque de tratativas.xlsx', 'ok');
    } else {
      exportRows(rows, 'Estoque de tratativas.csv');
    }
  }

  function clearTreatmentMap() {
    if (!treatmentMap.size) return setStatus('Não há tratativas salvas para limpar.', 'warn');
    var ok = window.confirm('Deseja apagar todas as tratativas salvas neste navegador?');
    if (!ok) return;
    treatmentMap.clear();
    treatmentSheetSync.pending.clear();
    state.rows.forEach(function (row) { row.tratativa = row._importTratativa || ''; });
    clearTreatmentsFromSheet();
    persistTreatmentMapAndBase();
    applyAndRender();
    setStatus('Todas as tratativas salvas foram removidas.', 'warn');
  }

  function damageRowsForExport() {
    return Array.from(damageShipmentSet).sort(localeSort).map(function (br) {
      var row = findRowByShipment(br);
      return {
        BR: br,
        encontrado_na_base: row ? 'Sim' : 'Não',
        tracking_status: row ? row.tracking_status : '',
        ageing_last_status: row ? row.ageing_last_status : '',
        cogs: row ? formatCogs(row) : '',
        buyer_city: row ? row.buyer_city : '',
        driver_id: row ? row.driver_id : '',
        driver_name: row ? row.driver_name : '',
        CEP: row ? row.cep : '',
        bairro: row ? row.bairro : '',
        tratativa: row ? row.tratativa : '',
        avaria: 'Sim'
      };
    });
  }

  function removeDamageShipment(br) {
    var key = normalizeTrace(br);
    if (!key) return;
    damageShipmentSet.delete(key);
    safeSetStorage(DAMAGE_STORAGE_KEY, Array.from(damageShipmentSet).sort(localeSort).join('\n'));
    applyDamageListToRows();
    populateFilters();
    applyAndRender();
    setStatus('BR removida da lista de avarias: ' + key, 'warn');
  }

  function renderDamagePage() {
    if (!els.damageTable) return;
    var list = Array.from(damageShipmentSet).sort(localeSort);
    var rowsHtml = list.map(function (br) {
      var row = findRowByShipment(br);
      var status = row ? row.tracking_status : 'Não encontrada';
      var city = row ? (row.cidade_cep || row.buyer_city || '-') : '-';
      var cep = row ? (row.cep || '-') : '-';
      var bairro = row ? (row.bairro || '-') : '-';
      var driver = row ? (row.driver_name || row.driver_id || 'Sem driver') : '-';
      var ageing = row ? (row.ageing_last_status || '-') : '-';
      var cogs = row ? formatCogs(row) : '-';
      var tratativa = row ? (row.tratativa || '-') : '-';
      return '<tr>' +
        '<td><strong>' + escapeHtml(br) + '</strong></td>' +
        '<td>' + (row ? yesNoPill('Sim') : '<span class="status-pill st-other">Fora da base</span>') + '</td>' +
        '<td>' + statusPill(status) + '</td>' +
        '<td>' + escapeHtml(city) + '</td>' +
        '<td>' + escapeHtml(cep) + '</td>' +
        '<td>' + escapeHtml(bairro) + '</td>' +
        '<td>' + escapeHtml(driver) + '</td>' +
        '<td>' + escapeHtml(ageing) + '</td>' +
        '<td>' + escapeHtml(cogs) + '</td>' +
        '<td class="treatment-summary">' + escapeHtml(tratativa) + '</td>' +
        '<td><button class="text-button danger" data-remove-damage="' + escapeAttr(br) + '" type="button">Remover</button></td>' +
      '</tr>';
    }).join('');
    var headers = ['BR', 'Avaria', 'tracking_status', 'Cidade', 'CEP', 'Bairro', 'Driver', 'Ageing', 'COGS', 'Tratativa', 'Ação'];
    els.damageTable.innerHTML = '<thead><tr>' + headers.map(function (header) { return '<th>' + escapeHtml(header) + '</th>'; }).join('') + '</tr></thead><tbody>' + (rowsHtml || '<tr><td colspan="11">Nenhuma BR cadastrada como avaria.</td></tr>') + '</tbody>';
    els.damageTable.querySelectorAll('[data-remove-damage]').forEach(function (button) {
      button.addEventListener('click', function () { removeDamageShipment(button.dataset.removeDamage); });
    });
  }

  async function importStucksFile(file) {
    try {
      if (!file) throw new Error('Nenhum arquivo selecionado.');
      validateImportFile(file);
      setStatus('Lendo STUCKS: ' + file.name + '...', 'warn');
      var rows = await parseAnyFileRows(file, 'stucks');
      setStatus('Arquivo lido. Processando ' + Math.max(0, rows.length - 1) + ' linha(s)...', 'warn');
      await processImportedRows(rows, file.name);
    } catch (error) {
      console.error(error);
      setStatus('Erro ao importar STUCKS: ' + (error.message || 'verifique a planilha.'), 'error');
      throw error;
    }
  }

  async function importCepFile(file) {
    try {
      if (!file) throw new Error('Nenhum arquivo selecionado.');
      validateImportFile(file);
      if (!state.rows.length) setStatus('Importando CEP. Depois importe/carregue a STUCKS para cruzar os rastreios.', 'warn');
      else setStatus('Lendo CEP: ' + file.name + '...', 'warn');
      var rows = await parseAnyFileRows(file, 'cep');
      applyCepImport(rows, file.name);
    } catch (error) {
      console.error(error);
      setStatus('Erro ao importar CEP: ' + (error.message || 'verifique se há BR/rastreio e CEP.'), 'error');
      throw error;
    }
  }

  function validateImportFile(file) {
    var name = String(file && file.name || '');
    if (!/\.(xlsx|xls|csv|tsv|zip)$/i.test(name)) {
      throw new Error('Formato não aceito. Use .xlsx, .xls, .csv, .tsv ou .zip.');
    }
    if (!file.size) throw new Error('Arquivo vazio ou bloqueado pelo navegador.');
    if (!window.XLSX && /\.(xlsx|xls|zip)$/i.test(name)) {
      throw new Error('Biblioteca XLSX não carregou. Atualize a página com Ctrl+F5 e confira se a pasta vendor foi enviada ao GitHub.');
    }
  }

  async function parseAnyFileRows(file, importType) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'zip') return parseZipRows(file, importType);
    if (ext === 'csv' || ext === 'tsv') return parseCsv(await file.text());
    return parseWorkbook(await file.arrayBuffer());
  }

  function parseWorkbook(buffer) {
    if (!window.XLSX) throw new Error('Biblioteca XLSX não carregada.');
    var workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    var sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Arquivo sem abas.');
    var sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  }

  function parseCsv(text) {
    var clean = String(text || '').replace(/^﻿/, '');
    var delimiter = detectDelimiter(clean);
    var lines = clean.split(/\r?\n/).filter(function (line) { return line.trim() !== ''; });
    return lines.map(function (line) { return splitCsvLine(line, delimiter); });
  }

  function detectDelimiter(text) {
    var firstLine = (text.split(/\r?\n/).find(function (line) { return line.trim(); }) || '');
    var candidates = [';', ',', '	'];
    var best = ',', bestCount = 0;
    candidates.forEach(function (candidate) {
      var count = splitCsvLine(firstLine, candidate).length;
      if (count > bestCount) { bestCount = count; best = candidate; }
    });
    return best;
  }

  function splitCsvLine(line, delimiter) {
    var values = [], current = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var char = line[i], next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') { current += '"'; i++; }
      else if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) { values.push(current); current = ''; }
      else current += char;
    }
    values.push(current);
    return values;
  }

  async function parseZipRows(file, importType) {
    var entries = await unzipEntries(await file.arrayBuffer());
    var candidates = Array.from(entries.entries())
      .filter(function (entry) { return /\.(xlsx|xls|csv|tsv)$/i.test(entry[0]) && entry[0].indexOf('__MACOSX') < 0; })
      .map(function (entry) { return { name: entry[0], content: entry[1], score: zipScore(entry[0], importType) }; })
      .sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name, 'pt-BR'); });
    if (!candidates.length) throw new Error('Não encontrei .xlsx, .xls, .csv ou .tsv dentro do ZIP.');
    var selected = candidates[0];
    setStatus('Lendo ' + selected.name + ' dentro do ZIP...', 'warn');
    if (/\.(csv|tsv)$/i.test(selected.name)) return parseCsv(new TextDecoder('utf-8').decode(selected.content));
    return parseWorkbook(selected.content.buffer.slice(selected.content.byteOffset, selected.content.byteOffset + selected.content.byteLength));
  }

  function zipScore(name, importType) {
    var lower = normalizeHeader(name);
    var score = 0;
    if (importType === 'cep' && (lower.indexOf('cep') >= 0 || lower.indexOf('postal') >= 0 || lower.indexOf('zip') >= 0)) score += 20;
    if (importType === 'stucks' && (lower.indexOf('stuck') >= 0 || lower.indexOf('base') >= 0 || lower.indexOf('operacional') >= 0)) score += 20;
    if (/\.xlsx$/i.test(name)) score += 8;
    if (/\.csv$/i.test(name)) score += 4;
    return score;
  }

  async function inflateRaw(bytes) {
    if (!('DecompressionStream' in window)) throw new Error('Seu navegador não permite ler ZIP diretamente. Extraia o XLSX/CSV e importe novamente.');
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function readUInt16(view, offset) { return view.getUint16(offset, true); }
  function readUInt32(view, offset) { return view.getUint32(offset, true); }

  async function unzipEntries(buffer) {
    var view = new DataView(buffer);
    var bytes = new Uint8Array(buffer);
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
      if (readUInt32(view, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Arquivo ZIP inválido.');
    var entryCount = readUInt16(view, eocd + 10);
    var offset = readUInt32(view, eocd + 16);
    var decoder = new TextDecoder('utf-8');
    var entries = new Map();
    for (var n = 0; n < entryCount; n++) {
      if (readUInt32(view, offset) !== 0x02014b50) break;
      var method = readUInt16(view, offset + 10);
      var compressedSize = readUInt32(view, offset + 20);
      var nameLength = readUInt16(view, offset + 28);
      var extraLength = readUInt16(view, offset + 30);
      var commentLength = readUInt16(view, offset + 32);
      var localOffset = readUInt32(view, offset + 42);
      var name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      var localNameLength = readUInt16(view, localOffset + 26);
      var localExtraLength = readUInt16(view, localOffset + 28);
      var dataStart = localOffset + 30 + localNameLength + localExtraLength;
      var compressed = bytes.slice(dataStart, dataStart + compressedSize);
      var content = new Uint8Array();
      if (method === 0) content = compressed;
      else if (method === 8) content = await inflateRaw(compressed);
      entries.set(name, content);
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  async function processImportedRows(rawRows, fileName) {
    if (!rawRows || rawRows.length < 2) throw new Error('A planilha precisa ter cabeçalho e pelo menos uma linha de dados.');
    var headerIndex = findHeaderRow(rawRows, REQUIRED_FIELDS);
    if (headerIndex < 0) throw new Error('Não encontrei os cabeçalhos necessários.');
    var headers = rawRows[headerIndex].map(cleanCell);
    var map = buildHeaderMap(headers, IMPORT_FIELDS.concat(OPTIONAL_FIELDS));
    var missing = REQUIRED_FIELDS.filter(function (field) { return map[field] == null; });
    if (missing.length) throw new Error('Colunas obrigatórias não encontradas: ' + missing.map(label).join(', ') + '. Esta versão aceita também bases com TN/Status/Dias parados/Valor/Cidade/Entregador. Tratativa e driver podem ficar em branco.');

    var rows = [];
    for (var i = headerIndex + 1; i < rawRows.length; i++) {
      var raw = rawRows[i] || [];
      var row = {};
      IMPORT_FIELDS.forEach(function (field) { row[field] = map[field] != null ? cleanCell(raw[map[field]]) : ''; });
      row.tratativa = map.tratativa != null ? cleanCell(raw[map.tratativa]) : '';
      if (!row.shipment_id && REQUIRED_FIELDS.every(function (field) { return !row[field]; })) continue;
      row.shipment_id = normalizeTrace(row.shipment_id);
      row.avaria = map.avaria != null ? normalizeYesNo(raw[map.avaria]) : 'Não';
      row._importTratativa = cleanCell(row.tratativa || '');
      row._importAvaria = row.avaria;
      row.cep = map.cep != null ? normalizeCep(raw[map.cep]) : '';
      row.cidade_cep = '';
      row.bairro = '';
      row.status_cep = row.cep ? 'CEP sem bairro' : 'Sem CEP importado';
      row._ageing = parseAgeing(row.ageing_last_status);
      row._cogsNumber = parseNumber(row.cogs);
      enrichRow(row);
      rows.push(row);
    }

    state.rows = dedupeByShipment(rows);
    state.fileName = fileName;
    state.importedAt = new Date().toISOString();
    applyCachedCepUpdatesToRows();
    applyReferenceToExistingCeps();
    applyDamageListToRows();
    applyTreatmentMapToRows();
    resetFilters(false);
    addHistory(fileName, state.rows);
    populateFilters();
    applyAndRender();
    persistCurrentBaseSilent();
    setStatus('Importação concluída: ' + state.rows.length + ' stucks carregados de ' + fileName + '. Tratativas locais/nuvem foram reaplicadas automaticamente pela BR.', 'ok');
  }

  function dedupeByShipment(rows) {
    var map = new Map();
    rows.forEach(function (row) { if (row.shipment_id) map.set(row.shipment_id, row); });
    return Array.from(map.values());
  }

  function applyCepImport(rawRows, fileName) {
    if (!rawRows || rawRows.length < 2) throw new Error('A planilha de CEP precisa ter cabeçalho e dados.');
    var headerIndex = findHeaderRowByAliases(rawRows, [FIELD_ALIASES.shipment_id, FIELD_ALIASES.cep]);
    var headers = (rawRows[headerIndex] || []).map(cleanCell);
    var map = buildHeaderMap(headers, ['shipment_id', 'cep', 'tracking_status']);
    if (map.shipment_id == null || map.cep == null) throw new Error('Não encontrei as colunas de BR/rastreio e CEP na exportação.');

    var cepUpdateMap = new Map();
    for (var i = headerIndex + 1; i < rawRows.length; i++) {
      var raw = rawRows[i] || [];
      var key = normalizeTrace(raw[map.shipment_id]);
      if (!key) continue;

      var importedCep = normalizeCep(raw[map.cep]);
      var importedStatus = map.tracking_status != null ? cleanCell(raw[map.tracking_status]) : '';

      // A importação de CEP também pode trazer status atualizado.
      // Se a linha vier sem CEP, não apagamos o CEP anterior; só atualizamos status quando existir.
      if (importedCep || importedStatus) {
        var previous = cepImportCache.get(key) || {};
        var update = { cep: importedCep || normalizeCep(previous.cep), status: importedStatus || cleanCell(previous.status) };
        cepUpdateMap.set(key, update);
        cepImportCache.set(key, update);
      }
    }

    persistCepImportCache();

    var matched = 0, withNeighborhood = 0, statusUpdated = 0;
    state.rows.forEach(function (row) {
      var update = cepUpdateMap.get(normalizeTrace(row.shipment_id));
      if (!update) {
        enrichRow(row);
        return;
      }

      matched++;

      if (update.cep) row.cep = update.cep;
      row.cidade_cep = '';
      row.bairro = '';
      row.status_cep = row.cep ? 'CEP sem bairro' : 'Sem CEP importado';
      if (row.cep) applyCepReference(row);
      if (row.bairro) withNeighborhood++;

      if (update.status) {
        row.tracking_status = update.status;
        statusUpdated++;
      }

      enrichRow(row);
    });

    populateFilters();
    applyAndRender();
    persistCurrentBaseSilent();
    var statusText = statusUpdated ? '; ' + statusUpdated + ' status atualizados' : '; nenhum status atualizado';
    setStatus('CEP importado de ' + fileName + ': ' + matched + ' BRs cruzadas; ' + withNeighborhood + ' com bairro encontrado' + statusText + '.', 'ok');
  }

  function applyCachedCepUpdatesToRows() {
    if (!cepImportCache || !cepImportCache.size) return;
    state.rows.forEach(function (row) {
      var update = cepImportCache.get(normalizeTrace(row.shipment_id));
      if (!update) return;
      if (update.cep) row.cep = normalizeCep(update.cep);
      if (update.status) row.tracking_status = cleanCell(update.status);
    });
  }

  function applyReferenceToExistingCeps() {
    state.rows.forEach(function (row) {
      if (row.cep) applyCepReference(row);
      enrichRow(row);
    });
  }

  function applyCepReference(row) {
    row.cidade_cep = '';
    row.bairro = '';
    row.status_cep = 'CEP fora da base';
    var ref = cepByNumber.get(row.cep);
    if (ref) {
      row.cidade_cep = ref.cidade;
      row.bairro = ref.bairro;
      row.status_cep = ref.bairro ? 'Bairro encontrado' : 'CEP sem bairro';
    }
  }

  function enrichRow(row) {
    row._ageing = parseAgeing(row.ageing_last_status);
    row._cogsNumber = parseNumber(row.cogs);
    row._noDriver = !cleanCell(row.driver_id) && !cleanCell(row.driver_name);
    row.prioridade = priorityFor(row._ageing, row.avaria, row._noDriver);
    row.faixa_ageing = ageingRange(row._ageing);
  }

  function findHeaderRow(rawRows, fields) {
    var bestIndex = -1, bestScore = 0;
    rawRows.slice(0, 25).forEach(function (row, index) {
      var headers = (row || []).map(cleanCell);
      var map = buildHeaderMap(headers, fields);
      var score = fields.reduce(function (total, field) { return total + (map[field] != null ? 1 : 0); }, 0);
      if (score > bestScore) { bestScore = score; bestIndex = index; }
    });
    return bestScore >= Math.min(4, fields.length) ? bestIndex : -1;
  }

  function findHeaderRowByAliases(rawRows, aliasGroups) {
    var bestIndex = 0, bestScore = -1;
    rawRows.slice(0, 25).forEach(function (row, index) {
      var headers = (row || []).map(normalizeHeader);
      var score = aliasGroups.reduce(function (total, aliases) {
        var normalized = aliases.map(normalizeHeader);
        return total + (headers.some(function (header) { return normalized.some(function (alias) { return header === alias || header.indexOf(alias) >= 0; }); }) ? 1 : 0);
      }, 0);
      var filled = headers.filter(Boolean).length;
      var weighted = score * 10 + Math.min(filled, 6);
      if (weighted > bestScore) { bestScore = weighted; bestIndex = index; }
    });
    return bestIndex;
  }

  function buildHeaderMap(headers, fields) {
    var normalizedHeaders = headers.map(normalizeHeader);
    var map = {};
    fields.forEach(function (field) {
      var aliases = (FIELD_ALIASES[field] || [field]).map(normalizeHeader);
      for (var i = 0; i < normalizedHeaders.length; i++) {
        if (aliases.indexOf(normalizedHeaders[i]) >= 0) { map[field] = i; break; }
      }
      if (map[field] == null) {
        for (var j = 0; j < normalizedHeaders.length; j++) {
          if (aliases.some(function (alias) { return alias.length >= 4 && normalizedHeaders[j].indexOf(alias) >= 0; })) { map[field] = j; break; }
        }
      }
    });
    return map;
  }

  function rebuildCepIndex() {
    cepByNumber = new Map();
    cepReference.forEach(function (row) { if (row.cep) cepByNumber.set(row.cep, row); });
  }

  function populateFilters() {
    populateSelect(els.statusFilter, uniqueValues(state.rows, 'tracking_status'), 'Todos');
    populateSelect(els.cityFilter, uniqueValues(state.rows, 'buyer_city'), 'Todas');
    populateSelect(els.driverFilter, uniqueValues(state.rows, 'driver_name', 'driver_id'), 'Todos');
    if (els.ageingFilter) {
      var currentAgeing = state.filters.ageing || 'all';
      populateAgeingSelect(els.ageingFilter, state.rows, 'Todos');
      els.ageingFilter.value = optionExists(els.ageingFilter, currentAgeing) ? currentAgeing : 'all';
      state.filters.ageing = els.ageingFilter.value;
    }
    els.priorityFilter.value = ['all', 'Crítica', 'Alta', 'Média', 'Baixa'].indexOf(state.filters.priority) >= 0 ? state.filters.priority : 'all';
    els.avariaFilter.value = ['all', 'Sim', 'Não'].indexOf(state.filters.avaria) >= 0 ? state.filters.avaria : 'all';
    els.cepFilter.value = ['all', 'withCep', 'withNeighborhood', 'withoutCep'].indexOf(state.filters.cep) >= 0 ? state.filters.cep : 'all';
  }

  function populateSelect(select, values, allLabel) {
    if (!select) return;
    values = values || [];
    var current = select.value || 'all';
    select.innerHTML = '<option value="all">' + escapeHtml(allLabel) + '</option>' + values.map(function (value) {
      return '<option value="' + escapeAttr(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
    select.value = values.indexOf(current) >= 0 ? current : 'all';
  }

  function uniqueValues(rows, primary, secondary) {
    var set = new Set();
    rows.forEach(function (row) {
      var value = cleanCell(row[primary]) || (secondary ? cleanCell(row[secondary]) : '') || 'Não informado';
      set.add(value);
    });
    return Array.from(set).sort(localeSort);
  }

  function applyAndRender() {
    applyTreatmentMapToRows();
    state.filtered = filterRows(state.rows);
    renderAll();
  }

  function filterRows(rows) {
    var search = normalizeSearch(state.filters.search);
    return rows.filter(function (row) {
      var driverValue = row.driver_name || row.driver_id || 'Não informado';
      if (state.filters.status !== 'all' && (row.tracking_status || 'Não informado') !== state.filters.status) return false;
      if (state.filters.city !== 'all' && (row.buyer_city || 'Não informado') !== state.filters.city) return false;
      if (state.filters.driver !== 'all' && driverValue !== state.filters.driver) return false;
      if (!matchAgeingFilter(row._ageing, state.filters.ageing)) return false;
      if (state.filters.priority !== 'all' && row.prioridade !== state.filters.priority) return false;
      if (state.filters.avaria !== 'all' && row.avaria !== state.filters.avaria) return false;
      if (state.filters.cep === 'withCep' && !row.cep) return false;
      if (state.filters.cep === 'withNeighborhood' && !row.bairro) return false;
      if (state.filters.cep === 'withoutCep' && row.cep) return false;
      if (search) {
        var haystack = normalizeSearch(BASE_COLUMNS.map(function (field) { return row[field]; }).join(' '));
        if (haystack.indexOf(search) < 0) return false;
      }
      return true;
    });
  }

  function matchAgeingFilter(ageing, filter) {
    filter = filter || 'all';
    if (filter === 'all') return true;
    if (filter === 'blank') return ageing == null;
    if (ageing == null || !Number.isFinite(ageing)) return false;
    var numericFilter = /^-?\d+(\.\d+)?$/.test(String(filter)) ? Number(filter) : null;
    if (numericFilter != null && Number.isFinite(numericFilter)) return ageing === numericFilter;
    if (filter === '0-1') return ageing >= 0 && ageing <= 1;
    if (filter === '2-3') return ageing >= 2 && ageing <= 3;
    if (filter === '4-6') return ageing >= 4 && ageing <= 6;
    if (filter === '7-9') return ageing >= 7 && ageing <= 9;
    if (filter === '4+') return ageing >= 4;
    if (filter === '10+') return ageing >= 10;
    return true;
  }

  function renderAll() {
    var hasData = state.rows.length > 0;
    els.emptyState.classList.toggle('hidden', hasData);
    els.filterBar.classList.toggle('hidden', !hasData || state.view === 'monitoring');
    els.rowCount.textContent = String(state.rows.length);
    els.baseBadge.textContent = String(state.filtered.length);
    els.baseBadge.classList.toggle('hidden', !hasData);
    els.lastUpdate.textContent = hasData ? formatDateTime(state.importedAt) : 'Aguardando importação';

    renderKpis();
    renderGoalPanels();
    renderInsights();
    renderActiveFilters();
    renderPriorityList();
    renderCityRadar();
    renderTables();
    renderDamagePage();
    renderTreatmentsPage();
    renderHistory();
    renderCepReference();
    populateMonitorFilters();
    renderMonitoring();
    updateDamageSidebar();
    createIcons();
  }

  function renderEmpty() {
    state.filtered = [];
    renderAll();
    renderTable(els.baseTable, BASE_COLUMNS.map(label), []);
    renderDamagePage();
    renderTreatmentsPage();
    hardenGitHubPagesLayout();
  }

  var STATUS_KPI_DEFS = [
    { key: 'onhold', label: 'OnHold', icon: '⏸️' },
    { key: 'hubReceived', label: 'Hub_Received', icon: '📥' },
    { key: 'hubAssigned', label: 'Hub_Assigned', icon: '📌' },
    { key: 'socLHTransported', label: 'SOC_LHTransported', icon: '🚛' },
    { key: 'intercepting', label: 'Intercepting', icon: '🛑' },
    { key: 'hubPacked', label: 'Hub_Packed', icon: '📦' },
    { key: 'returnSOCReceived', label: 'Return_SOC_Received', icon: '↩️' },
    { key: 'returnHubReceived', label: 'Return_Hub_Received', icon: '🔁' }
  ];

  var STATUS_KPI_ALIASES = {
    onhold: 'onhold',
    onhol: 'onhold',
    hubreceived: 'hubReceived',
    hubreceveid: 'hubReceived',
    hubassigned: 'hubAssigned',
    soclhtransported: 'socLHTransported',
    soclhtransport: 'socLHTransported',
    intercepting: 'intercepting',
    hubpacked: 'hubPacked',
    returnsocreceived: 'returnSOCReceived',
    returnsocreceveid: 'returnSOCReceived',
    returnhubreceived: 'returnHubReceived',
    returnhubreceveid: 'returnHubReceived'
  };

  function renderKpis() {
    var rows = state.filtered;
    var total = rows.length;
    var damaged = rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
    var statusCards = STATUS_KPI_DEFS.map(function (item) {
      var count = rows.filter(function (row) { return statusKpiKey(row.tracking_status) === item.key; }).length;
      return kpi(item.icon + ' ' + item.label, count, percentText(count, total) + ' do total filtrado', 'statusKey:' + item.key);
    });

    els.kpis.innerHTML = [
      kpi('📦 Total de stucks', total, state.rows.length ? 'Dentro dos filtros atuais' : 'Importe a base para calcular', 'all')
    ].concat(statusCards, [
      kpi('⚠️ Total de avarias', damaged, percentText(damaged, total) + ' com avaria', 'damage')
    ]).join('');

    els.kpis.querySelectorAll('[data-kpi-filter]').forEach(function (card) {
      card.addEventListener('click', function () { quickFilter(card.dataset.kpiFilter); });
    });
  }

  function statusKpiKey(value) {
    var key = normalizeSearch(value).replace(/[^a-z0-9]/g, '');
    return STATUS_KPI_ALIASES[key] || '';
  }

  function firstStatusForKpiKey(key) {
    var found = state.rows.find(function (row) { return statusKpiKey(row.tracking_status) === key; });
    return found ? (found.tracking_status || 'Não informado') : '';
  }

  function kpi(title, value, note, filter) {
    var attr = filter ? ' data-kpi-filter="' + escapeAttr(filter) + '"' : '';
    return '<article class="kpi"' + attr + '><div><span>' + escapeHtml(title) + '</span><strong>' + escapeHtml(value) + '</strong></div><small>' + escapeHtml(note) + '</small></article>';
  }

  function renderGoalPanels() {
    var total = state.filtered.length;
    var critical = state.filtered.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
    var withDriver = state.filtered.filter(function (row) { return !row._noDriver; }).length;
    var criticalPct = total ? Math.round((critical / total) * 100) : 0;
    var driverPct = total ? Math.round((withDriver / total) * 100) : 0;

    setRing(els.criticalRing, criticalPct, criticalPct >= 35 ? 'var(--red)' : criticalPct >= 15 ? 'var(--amber)' : 'var(--green)');
    els.criticalPct.textContent = criticalPct + '%';
    els.criticalTitle.textContent = critical + ' BRs críticas';
    els.criticalText.textContent = total ? 'Prioridade para tratar primeiro pela maior idade do último status.' : 'Importe a base para calcular.';

    setRing(els.driverRing, driverPct, driverPct < 60 ? 'var(--red)' : driverPct < 85 ? 'var(--amber)' : 'var(--green)');
    els.driverPct.textContent = driverPct + '%';
    els.driverTitle.textContent = withDriver + ' com driver';
    els.driverText.textContent = total ? (total - withDriver) + ' BRs ainda sem driver informado.' : 'Importe a base para calcular.';
  }

  function setRing(element, pct, color) { element.style.background = 'conic-gradient(' + color + ' 0 ' + pct + '%, var(--surface-3) ' + pct + '% 100%)'; }

  function renderInsights() {
    var rows = state.filtered;
    if (!rows.length) {
      els.insightsList.innerHTML = metric('Aguardando importação', 'Os alertas aparecerão após carregar a base.', '-');
      return;
    }
    var critical = rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
    var noDriver = rows.filter(function (row) { return row._noDriver; }).length;
    var damaged = rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
    var withoutCep = rows.filter(function (row) { return !row.cep; }).length;
    var topCity = topGroup(rows, 'buyer_city')[0];
    els.insightsList.innerHTML = [
      metric('Tratar ageing 4+ primeiro', critical + ' BRs críticas na visão atual.', percentText(critical, rows.length)),
      metric('Checar BRs sem driver', noDriver + ' BRs sem responsável informado.', percentText(noDriver, rows.length)),
      metric('Avarias na fila', damaged + ' BRs marcadas com avaria.', percentText(damaged, rows.length)),
      metric('Cruzamento de CEP', withoutCep + ' BRs ainda sem CEP cruzado.', percentText(withoutCep, rows.length)),
      metric('Cidade de maior volume', topCity ? topCity.key + ' concentra mais stucks.' : 'Sem cidade informada.', topCity ? topCity.count : '-')
    ].join('');
  }

  function renderActiveFilters() {
    var items = [];
    if (state.filters.status !== 'all') items.push(['Status', state.filters.status]);
    if (state.filters.city !== 'all') items.push(['Cidade', state.filters.city]);
    if (state.filters.driver !== 'all') items.push(['Driver', state.filters.driver]);
    if (state.filters.ageing !== 'all') items.push(['Ageing', state.filters.ageing]);
    if (state.filters.priority !== 'all') items.push(['Prioridade', state.filters.priority]);
    if (state.filters.avaria !== 'all') items.push(['Avaria', state.filters.avaria]);
    if (state.filters.cep !== 'all') items.push(['CEP', cepFilterLabel(state.filters.cep)]);
    if (state.filters.search) items.push(['Busca', state.filters.search]);
    if (!items.length) items.push(['Sem filtros ativos', 'Mostrando toda a base importada']);
    els.activeFilters.innerHTML = items.map(function (item) { return metric(item[0], item[1], state.filtered.length + ' linhas'); }).join('');
  }

  function metric(title, description, value) {
    return '<div class="metric-row"><div><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(description) + '</span></div><div class="metric-value">' + escapeHtml(value) + '</div></div>';
  }

  function renderPriorityList() {
    var rows = state.filtered.slice().sort(function (a, b) {
      var p = priorityWeight(b.prioridade) - priorityWeight(a.prioridade);
      if (p !== 0) return p;
      var ageingDiff = (b._ageing == null ? -1 : b._ageing) - (a._ageing == null ? -1 : a._ageing);
      if (ageingDiff !== 0) return ageingDiff;
      return b._cogsNumber - a._cogsNumber;
    }).slice(0, 12);

    if (!rows.length) {
      els.priorityList.innerHTML = '<div class="list-row"><div><strong>Aguardando dados</strong><span>Importe a planilha para montar a fila.</span></div><b class="severity normal">0</b></div>';
      return;
    }
    els.priorityList.innerHTML = rows.map(function (row) {
      var sev = severity(row._ageing, row.prioridade);
      var sub = [row.tracking_status || 'Status não informado', row.buyer_city || 'Cidade não informada', row.driver_name || row.driver_id || 'Sem driver', row.avaria === 'Sim' ? 'Avaria' : '', row.bairro || row.cidade_cep || 'Sem CEP'].filter(Boolean).join(' • ');
      return '<div class="list-row"><div><strong>' + escapeHtml(row.shipment_id || '-') + '</strong><span>' + escapeHtml(sub) + '</span></div><b class="severity ' + sev.className + '">' + escapeHtml(sev.label) + '</b></div>';
    }).join('');
  }

  function priorityWeight(priority) { return { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 }[priority] || 0; }
  function severity(ageing, priority) {
    if (priority === 'Crítica') return { className: 'critical', label: 'Crítica' };
    if (priority === 'Alta') return { className: 'high', label: 'Alta' };
    if (priority === 'Média') return { className: 'normal', label: 'Média' };
    if (ageing == null) return { className: 'normal', label: 'S/AGE' };
    return { className: 'good', label: 'Baixa' };
  }

  function renderCityRadar() {
    var groups = topGroup(state.filtered, 'buyer_city').slice(0, 10);
    if (!groups.length) {
      els.cityRadar.innerHTML = '<button class="city-line"><strong>Aguardando dados</strong><span>0</span><div class="bar"><i style="width:0%"></i></div></button>';
      return;
    }
    var max = groups[0].count || 1;
    els.cityRadar.innerHTML = groups.map(function (item) {
      var pct = Math.round((item.count / max) * 100);
      return '<button class="city-line" data-city="' + escapeAttr(item.key) + '"><strong>' + escapeHtml(item.key) + '</strong><span>' + item.count + '</span><div class="bar"><i style="width:' + pct + '%"></i></div></button>';
    }).join('');
    els.cityRadar.querySelectorAll('[data-city]').forEach(function (button) {
      button.addEventListener('click', function () { state.filters.city = button.dataset.city; els.cityFilter.value = state.filters.city; applyAndRender(); });
    });
  }

  function setMonitorStatus(type) {
    if (!MONITOR_DEFS[type]) type = 'received';
    state.monitor.type = type;
    state.monitor.search = state.monitor.search || '';
    setView('monitoring');
    populateMonitorFilters();
    renderMonitoring();
  }

  function monitorDef(type) {
    return MONITOR_DEFS[type || state.monitor.type] || MONITOR_DEFS.received;
  }

  function rawStatusKey(value) {
    return normalizeSearch(value).replace(/[^a-z0-9]/g, '');
  }

  function rowMatchesMonitorStatusForType(row, type) {
    var def = monitorDef(type);
    var kpiKey = statusKpiKey(row.tracking_status);
    var rawKey = rawStatusKey(row.tracking_status);
    return def.statusKeys.indexOf(kpiKey) >= 0 || def.rawKeys.indexOf(rawKey) >= 0;
  }

  function rowMatchesMonitorStatus(row) {
    return rowMatchesMonitorStatusForType(row, state.monitor.type);
  }

  function monitorBaseRows(type) {
    return state.rows.filter(function (row) { return rowMatchesMonitorStatusForType(row, type || state.monitor.type); });
  }

  function monitorRowCity(row) {
    return cleanCell(row.cidade_cep) || cleanCell(row.buyer_city) || 'Não informado';
  }

  function monitorRowNeighborhood(row) {
    return cleanCell(row.bairro) || 'Sem bairro';
  }

  function isTeixeiraCityName(value) {
    return normalizeSearch(value).indexOf('teixeira de freitas') >= 0;
  }

  function monitorFilteredRows() {
    return monitorBaseRows().filter(function (row) {
      var city = monitorRowCity(row);
      var neighborhood = monitorRowNeighborhood(row);
      if (state.monitor.city !== 'all' && city !== state.monitor.city) return false;
      if (state.monitor.neighborhood !== 'all' && neighborhood !== state.monitor.neighborhood) return false;
      if (!matchAgeingFilter(row._ageing, state.monitor.ageing || 'all')) return false;
      return true;
    });
  }

  function monitorSearchMatches(rows) {
    var search = normalizeSearch(state.monitor.search);
    if (!search) return [];
    return rows.filter(function (row) {
      var haystack = normalizeSearch([row.shipment_id, row.tracking_status, row.buyer_city, row.cidade_cep, row.bairro, row.driver_name, row.driver_id, displayTreatmentLabel(row), row.cep].join(' '));
      return haystack.indexOf(search) >= 0;
    }).slice(0, 80);
  }

  function populateMonitorFilters() {
    if (!els.monitorCityFilter || !els.monitorNeighborhoodFilter) return;
    var baseRows = monitorBaseRows();
    var currentCity = state.monitor.city || 'all';
    var currentNeighborhood = state.monitor.neighborhood || 'all';
    var currentAgeing = state.monitor.ageing || 'all';
    var cities = uniqueMonitorValues(baseRows, monitorRowCity);
    populateSelect(els.monitorCityFilter, cities, 'Todas');
    if (cities.indexOf(currentCity) >= 0) {
      els.monitorCityFilter.value = currentCity;
      state.monitor.city = currentCity;
    } else {
      els.monitorCityFilter.value = 'all';
      state.monitor.city = 'all';
    }
    var neighborhoodRows = baseRows.filter(function (row) {
      return state.monitor.city === 'all' || monitorRowCity(row) === state.monitor.city;
    });
    var neighborhoods = uniqueMonitorValues(neighborhoodRows, monitorRowNeighborhood);
    populateSelect(els.monitorNeighborhoodFilter, neighborhoods, 'Todos');
    if (neighborhoods.indexOf(currentNeighborhood) >= 0) {
      els.monitorNeighborhoodFilter.value = currentNeighborhood;
      state.monitor.neighborhood = currentNeighborhood;
    } else {
      els.monitorNeighborhoodFilter.value = 'all';
      state.monitor.neighborhood = 'all';
    }
    var ageingRows = neighborhoodRows.filter(function (row) {
      return state.monitor.neighborhood === 'all' || monitorRowNeighborhood(row) === state.monitor.neighborhood;
    });
    if (els.monitorAgeingFilter) {
      populateAgeingSelect(els.monitorAgeingFilter, ageingRows, 'Todos');
      els.monitorAgeingFilter.value = optionExists(els.monitorAgeingFilter, currentAgeing) ? currentAgeing : 'all';
      state.monitor.ageing = els.monitorAgeingFilter.value;
    }
    if (els.monitorSortFilter) els.monitorSortFilter.value = state.monitor.sort || 'desc';
    if (els.monitorSearchInput && els.monitorSearchInput.value !== state.monitor.search) els.monitorSearchInput.value = state.monitor.search || '';
  }

  function uniqueMonitorValues(rows, getter) {
    var set = new Set();
    rows.forEach(function (row) { set.add(getter(row) || 'Não informado'); });
    return Array.from(set).sort(localeSort);
  }

  function renderMonitoring() {
    if (!els.monitorSummaryTable) return;
    var def = monitorDef();
    var baseRows = monitorBaseRows();
    var rows = monitorFilteredRows();

    if (els.monitorTotalNote) {
      var teixeiraSemBairro = rows.filter(function (row) { return isTeixeiraCityName(monitorRowCity(row)) && monitorRowNeighborhood(row) === 'Sem bairro'; }).length;
      els.monitorTotalNote.textContent = rows.length + ' BRs exibidas de ' + baseRows.length + ' no status ' + def.label + (teixeiraSemBairro ? ' · ' + teixeiraSemBairro + ' BR(s) de Teixeira ainda sem bairro/CEP' : '');
    }
    if (els.monitorSummaryTitle) els.monitorSummaryTitle.textContent = def.title + ' - BRs em ' + def.label + ' por cidade/bairro';

    renderMonitorSearchResults(rows);
    renderMonitorSummaryTable(groupMonitorRows(rows));
  }

  function displayTreatmentLabel(row) {
    var treatment = cleanCell(row && row.tratativa || '');
    if (treatment) return treatment;
    var avaria = normalizeYesNo(row && row.avaria);
    var status = normalizeSearch(row && row.tracking_status || '');
    if (avaria === 'Sim' || status === 'avaria') return 'AVARIA';
    return 'Sem tratativa';
  }

  function formatGroupTreatments(treatments) {
    var items = Array.from(treatments.entries()).sort(function (a, b) { return b[1] - a[1] || localeSort(a[0], b[0]); });
    if (!items.length) return 'Sem tratativa';
    var visible = items.slice(0, 2).map(function (item) { return item[1] > 1 ? item[0] + ' (' + item[1] + ')' : item[0]; });
    var extra = items.length > 2 ? ' +' + (items.length - 2) : '';
    return visible.join(' | ') + extra;
  }

  function formatGroupStatuses(statuses) {
    var items = Array.from(statuses.entries()).sort(function (a, b) { return b[1] - a[1] || localeSort(a[0], b[0]); });
    if (!items.length) return 'Status não informado';
    var visible = items.slice(0, 2).map(function (item) { return item[1] > 1 ? item[0] + ' (' + item[1] + ')' : item[0]; });
    var extra = items.length > 2 ? ' +' + (items.length - 2) : '';
    return visible.join(' | ') + extra;
  }

  function groupMonitorRows(rows) {
    var map = new Map();
    rows.forEach(function (row) {
      var city = monitorRowCity(row);
      var neighborhood = monitorRowNeighborhood(row);
      var ageingKey = row._ageing == null || !Number.isFinite(row._ageing) ? 'blank' : String(row._ageing);
      var key = city + '||' + neighborhood + '||' + ageingKey;
      if (!map.has(key)) map.set(key, { city: city, neighborhood: neighborhood, ageing: row._ageing, ageingKey: ageingKey, rows: [], treatments: new Map(), statuses: new Map() });
      var data = map.get(key);
      data.rows.push(row);
      var statusLabel = cleanCell(row.tracking_status || row.status || '') || 'Status não informado';
      data.statuses.set(statusLabel, (data.statuses.get(statusLabel) || 0) + 1);
      var treatment = displayTreatmentLabel(row);
      if (treatment && treatment !== 'Sem tratativa') data.treatments.set(treatment, (data.treatments.get(treatment) || 0) + 1);
    });
    var groups = Array.from(map.values()).map(function (item) {
      return {
        city: item.city,
        neighborhood: item.neighborhood,
        status: formatGroupStatuses(item.statuses),
        treatment: formatGroupTreatments(item.treatments),
        ageing: item.ageing,
        ageingText: formatAgeingDays(item.ageing),
        qty: item.rows.length,
        rows: item.rows,
        isTeixeira: isTeixeiraCityName(item.city),
        hasNeighborhood: item.neighborhood !== 'Sem bairro'
      };
    });

    // Corrigido: o agrupamento agora considera Cidade + Bairro + Dias parados.
    // Assim a coluna Dias parados mostra o dia real do grupo e nunca mistura valores diferentes.
    groups.sort(function (a, b) {
      if (a.isTeixeira !== b.isTeixeira) return a.isTeixeira ? -1 : 1;
      if (a.isTeixeira && b.isTeixeira && a.hasNeighborhood !== b.hasNeighborhood) return a.hasNeighborhood ? -1 : 1;
      var diff = a.qty - b.qty;
      if (diff !== 0) return state.monitor.sort === 'asc' ? diff : -diff;
      var ageDiff = (b.ageing == null ? -Infinity : b.ageing) - (a.ageing == null ? -Infinity : a.ageing);
      if (ageDiff !== 0) return ageDiff;
      return localeSort(a.city, b.city) || localeSort(a.neighborhood, b.neighborhood);
    });
    return groups;
  }

  function formatAgeingDays(ageing) {
    if (ageing == null || !Number.isFinite(ageing)) return 'Sem dias';
    var label = ageing === 1 ? ' dia' : ' dias';
    return String(ageing).replace('.', ',') + label;
  }

  function populateAgeingSelect(select, rows, allLabel) {
    if (!select) return;
    var values = [];
    var hasBlank = false;
    rows.forEach(function (row) {
      if (row._ageing == null || !Number.isFinite(row._ageing)) {
        hasBlank = true;
      } else if (values.indexOf(row._ageing) < 0) {
        values.push(row._ageing);
      }
    });
    values.sort(function (a, b) { return b - a; });
    var html = '<option value="all">' + escapeHtml(allLabel || 'Todos') + '</option>';
    html += values.map(function (value) {
      return '<option value="' + escapeAttr(String(value)) + '">' + escapeHtml(formatAgeingDays(value)) + '</option>';
    }).join('');
    if (hasBlank) html += '<option value="blank">Sem dias</option>';
    html += '<option value="4+">4+ dias</option><option value="10+">10+ dias</option>';
    select.innerHTML = html;
  }

  function formatOneDecimal(value) {
    if (value == null || !Number.isFinite(value)) return '-';
    return String(Math.round(value * 10) / 10).replace('.', ',');
  }

  function renderMonitorSummaryTable(groups) {
    monitorGroupCache.clear();
    var head = '<thead><tr><th>Cidade</th><th>Bairro</th><th>Status</th><th>Tratativa</th><th>Dias parados</th><th>Qtd</th><th></th></tr></thead>';
    var body = groups.length ? groups.map(function (item, index) {
      var payload = { type: state.monitor.type, city: item.city, neighborhood: item.neighborhood, ageing: item.ageing == null ? 'blank' : String(item.ageing) };
      var groupId = 'grupo_' + index;
      monitorGroupCache.set(groupId, { payload: payload, rows: item.rows.slice() });
      return '<tr class="clickable">' +
        '<td>' + escapeHtml(item.city) + '</td>' +
        '<td>' + escapeHtml(item.neighborhood) + '</td>' +
        '<td class="status-source-cell">' + escapeHtml(item.status) + '</td>' +
        '<td class="treatment-summary">' + escapeHtml(item.treatment) + '</td>' +
        '<td><strong>' + escapeHtml(item.ageingText) + '</strong></td>' +
        '<td><strong>' + escapeHtml(item.qty) + '</strong></td>' +
        '<td><button class="mini-button" type="button" data-open-monitor-group="' + escapeAttr(groupId) + '">Abrir</button></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="7">Nenhuma BR encontrada neste status.</td></tr>';
    els.monitorSummaryTable.innerHTML = head + '<tbody>' + body + '</tbody>';
    // Abrir usa o ID interno do grupo. Isso evita falha por acentos, espaços, letras maiúsculas/minúsculas ou dias parados.
  }

  function renderMonitorSearchResults(rows) {
    if (!els.monitorSearchResults) return;
    var matches = monitorSearchMatches(rows);
    if (!state.monitor.search) {
      els.monitorSearchResults.innerHTML = '';
      return;
    }
    els.monitorSearchResults.innerHTML = matches.map(function (row) {
      var payload = { type: state.monitor.type, shipment: row.shipment_id };
      return '<button class="list-row" type="button" data-open-monitor="' + escapeAttr(JSON.stringify(payload)) + '">' +
        '<span><strong>' + escapeHtml(row.shipment_id || '-') + '</strong>' +
        '<span>' + escapeHtml([row.tracking_status || '-', 'Dias: ' + (row._ageing == null ? '-' : row._ageing), row.cep || 'Sem CEP', monitorRowCity(row), monitorRowNeighborhood(row), row.driver_name || row.driver_id || 'Sem driver', displayTreatmentLabel(row)].join(' | ')) + '</span></span>' +
        '<b class="severity high">Abrir BR</b>' +
      '</button>';
    }).join('') || '<p class="muted">Nenhuma BR encontrada na busca deste monitoramento.</p>';
    // O clique do resultado de busca também usa a delegação global.
  }

  function sameNormalizedText(a, b) {
    return normalizeSearch(a) === normalizeSearch(b);
  }

  function rowsForMonitorPayload(payload) {
    payload = payload || {};
    var type = payload.type || state.monitor.type;
    var wantedShipment = normalizeTrace(payload.shipment || '');
    var wantedCity = cleanCell(payload.city || '');
    var wantedNeighborhood = cleanCell(payload.neighborhood || '');
    var wantedAgeing = payload.ageing == null ? 'all' : String(payload.ageing);

    return monitorBaseRows(type).filter(function (row) {
      if (wantedShipment) return normalizeTrace(row.shipment_id) === wantedShipment;
      if (wantedCity && !sameNormalizedText(monitorRowCity(row), wantedCity)) return false;
      if (wantedNeighborhood && !sameNormalizedText(monitorRowNeighborhood(row), wantedNeighborhood)) return false;
      if (wantedAgeing !== 'all' && !matchAgeingFilter(row._ageing, wantedAgeing)) return false;
      return true;
    }).sort(function (a, b) {
      var ageingDiff = (b._ageing == null ? -1 : b._ageing) - (a._ageing == null ? -1 : a._ageing);
      if (ageingDiff !== 0) return ageingDiff;
      return sortValue(b._cogsNumber, a._cogsNumber, 'desc');
    });
  }

  function openMonitorDetails(payload) {
    openMonitorDetailsFromRows(payload, rowsForMonitorPayload(payload || {}));
  }

  function openMonitorDetailsFromRows(payload, rows) {
    payload = payload || {};
    rows = Array.isArray(rows) ? rows.slice() : [];
    monitorModalContext = payload;
    monitorModalAllRows = rows;
    monitorModalRows = rows.slice();

    var titleCity = cleanCell(payload.city) || (rows[0] ? monitorRowCity(rows[0]) : 'Grupo');
    var titleNeighborhood = cleanCell(payload.neighborhood) || (rows[0] ? monitorRowNeighborhood(rows[0]) : '');
    var ageingTitle = payload.ageing != null && payload.ageing !== 'all' ? ' / ' + formatAgeingDays(payload.ageing === 'blank' ? null : Number(payload.ageing)) : '';
    if (els.monitorModalTitle) els.monitorModalTitle.textContent = monitorDef(payload.type).title + ' - ' + titleCity + (titleNeighborhood ? ' / ' + titleNeighborhood : '') + ageingTitle;
    if (els.monitorModalSubtitle) els.monitorModalSubtitle.textContent = rows.length + ' pacote(s) encontrados para revisão.';

    resetMonitorModalFilters(false);
    if (payload.ageing != null) monitorModalFilters.ageing = String(payload.ageing);
    populateMonitorModalFilters();
    renderMonitorModalTable();

    if (!els.monitorModal) return;
    try {
      if (els.monitorModal.showModal && !els.monitorModal.open) els.monitorModal.showModal();
      else els.monitorModal.setAttribute('open', 'open');
    } catch (error) {
      console.warn('Falha no showModal; abrindo com fallback.', error);
      els.monitorModal.setAttribute('open', 'open');
    }
  }

  function closeMonitorModal() {
    if (!els.monitorModal) return;
    if (els.monitorModal.close) els.monitorModal.close();
    else els.monitorModal.removeAttribute('open');
  }

  function resetMonitorModalFilters(updateInputs) {
    monitorModalFilters = { status: 'all', city: 'all', neighborhood: 'all', ageing: 'all', driver: 'all', sort: 'default', search: '' };
    if (updateInputs !== false) {
      populateMonitorModalFilters();
      renderMonitorModalTable();
    }
  }

  function clearMonitorModalFilters() {
    resetMonitorModalFilters();
  }

  function populateMonitorModalFilters() {
    if (!els.monitorDetailStatusFilter) return;
    var current = Object.assign({}, monitorModalFilters);
    populateSelect(els.monitorDetailStatusFilter, uniqueValuesFromRows(monitorModalAllRows, function (row) { return row.tracking_status || 'Não informado'; }), 'Todos');
    els.monitorDetailStatusFilter.value = optionExists(els.monitorDetailStatusFilter, current.status) ? current.status : 'all';
    monitorModalFilters.status = els.monitorDetailStatusFilter.value;

    populateSelect(els.monitorDetailCityFilter, uniqueValuesFromRows(monitorModalAllRows, monitorRowCity), 'Todas');
    els.monitorDetailCityFilter.value = optionExists(els.monitorDetailCityFilter, current.city) ? current.city : 'all';
    monitorModalFilters.city = els.monitorDetailCityFilter.value;

    var neighborhoodBase = monitorModalAllRows.filter(function (row) {
      return monitorModalFilters.city === 'all' || monitorRowCity(row) === monitorModalFilters.city;
    });
    populateSelect(els.monitorDetailNeighborhoodFilter, uniqueValuesFromRows(neighborhoodBase, monitorRowNeighborhood), 'Todos');
    els.monitorDetailNeighborhoodFilter.value = optionExists(els.monitorDetailNeighborhoodFilter, current.neighborhood) ? current.neighborhood : 'all';
    monitorModalFilters.neighborhood = els.monitorDetailNeighborhoodFilter.value;

    var ageingBase = neighborhoodBase.filter(function (row) {
      return monitorModalFilters.neighborhood === 'all' || monitorRowNeighborhood(row) === monitorModalFilters.neighborhood;
    });
    if (els.monitorDetailAgeingFilter) {
      populateAgeingSelect(els.monitorDetailAgeingFilter, ageingBase, 'Todos');
      els.monitorDetailAgeingFilter.value = optionExists(els.monitorDetailAgeingFilter, current.ageing || 'all') ? (current.ageing || 'all') : 'all';
      monitorModalFilters.ageing = els.monitorDetailAgeingFilter.value;
    }

    var driverBase = ageingBase.filter(function (row) {
      return matchAgeingFilter(row._ageing, monitorModalFilters.ageing || 'all');
    });
    populateSelect(els.monitorDetailDriverFilter, uniqueValuesFromRows(driverBase, function (row) { return row.driver_name || row.driver_id || 'Sem driver'; }), 'Todos');
    els.monitorDetailDriverFilter.value = optionExists(els.monitorDetailDriverFilter, current.driver) ? current.driver : 'all';
    monitorModalFilters.driver = els.monitorDetailDriverFilter.value;

    if (els.monitorDetailSortFilter) els.monitorDetailSortFilter.value = current.sort || 'default';
    monitorModalFilters.sort = els.monitorDetailSortFilter ? els.monitorDetailSortFilter.value : 'default';
    if (els.monitorDetailSearchInput && els.monitorDetailSearchInput.value !== (current.search || '')) els.monitorDetailSearchInput.value = current.search || '';
    monitorModalFilters.search = current.search || '';
  }

  function optionExists(select, value) {
    if (!select) return false;
    return Array.from(select.options || []).some(function (option) { return option.value === value; });
  }

  function uniqueValuesFromRows(rows, getter) {
    var set = new Set();
    rows.forEach(function (row) {
      var value = cleanCell(getter(row)) || 'Não informado';
      set.add(value);
    });
    return Array.from(set).sort(localeSort);
  }

  function monitorModalFilteredRows() {
    var search = normalizeSearch(monitorModalFilters.search || '');
    var rows = monitorModalAllRows.filter(function (row) {
      if (monitorModalFilters.status !== 'all' && (row.tracking_status || 'Não informado') !== monitorModalFilters.status) return false;
      if (monitorModalFilters.city !== 'all' && monitorRowCity(row) !== monitorModalFilters.city) return false;
      if (monitorModalFilters.neighborhood !== 'all' && monitorRowNeighborhood(row) !== monitorModalFilters.neighborhood) return false;
      if (!matchAgeingFilter(row._ageing, monitorModalFilters.ageing || 'all')) return false;
      var driver = row.driver_name || row.driver_id || 'Sem driver';
      if (monitorModalFilters.driver !== 'all' && driver !== monitorModalFilters.driver) return false;
      if (search) {
        var haystack = normalizeSearch([row.shipment_id, row.tracking_status, row.cep, monitorRowCity(row), monitorRowNeighborhood(row), row.driver_id, row.driver_name, displayTreatmentLabel(row)].join(' '));
        if (haystack.indexOf(search) < 0) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      if (monitorModalFilters.sort === 'ageing_desc') return sortValue(a._ageing, b._ageing, 'desc');
      if (monitorModalFilters.sort === 'ageing_asc') return sortValue(a._ageing, b._ageing, 'asc');
      if (monitorModalFilters.sort === 'cogs_desc') return sortValue(a._cogsNumber, b._cogsNumber, 'desc');
      if (monitorModalFilters.sort === 'cogs_asc') return sortValue(a._cogsNumber, b._cogsNumber, 'asc');
      if (monitorModalFilters.sort === 'br_asc') return localeSort(a.shipment_id || '', b.shipment_id || '');
      var ageingDiff = (b._ageing == null ? -1 : b._ageing) - (a._ageing == null ? -1 : a._ageing);
      if (ageingDiff !== 0) return ageingDiff;
      return sortValue(b._cogsNumber, a._cogsNumber, 'desc');
    });
    return rows;
  }

  function updateMonitorModalSubtitle() {
    if (els.monitorModalSubtitle) els.monitorModalSubtitle.textContent = monitorModalRows.length + ' de ' + monitorModalAllRows.length + ' pacote(s) encontrados';
  }

  function statusSelectForRow(row) {
    var current = row.tracking_status || '';
    var statuses = uniqueValuesFromRows(state.rows, function (item) { return item.tracking_status || 'Não informado'; });
    ['Avaria', 'Received', 'Hub_Received', 'Hub_Assigned', 'SOC_LHTransported', 'OnHold', 'Hub_Packed', 'Intercepting', 'Return_SOC_Received', 'Return_Hub_Received'].forEach(function (status) {
      if (statuses.indexOf(status) < 0) statuses.push(status);
    });
    statuses.sort(localeSort);
    return '<select class="modal-status-select" data-status-br="' + escapeAttr(row.shipment_id) + '">' + statuses.map(function (status) {
      var selected = status === current ? ' selected' : '';
      return '<option value="' + escapeAttr(status) + '"' + selected + '>' + escapeHtml(status) + '</option>';
    }).join('') + '</select>';
  }

  function renderMonitorModalTable() {
    if (!els.monitorModalTable) return;
    monitorModalRows = monitorModalFilteredRows();
    updateMonitorModalSubtitle();
    var headers = ['Tracking', 'Status', 'CEP', 'Cidade', 'Bairro', 'Driver ID', 'Driver', 'Dias', 'COGS', 'Avaria', 'Tratativa'];
    var head = '<thead><tr>' + headers.map(function (header) { return '<th>' + escapeHtml(header) + '</th>'; }).join('') + '</tr></thead>';
    var body = monitorModalRows.length ? monitorModalRows.map(function (row) {
      return '<tr>' +
        '<td><strong>' + escapeHtml(row.shipment_id || '-') + '</strong></td>' +
        '<td>' + statusSelectForRow(row) + '</td>' +
        '<td>' + escapeHtml(row.cep || '-') + '</td>' +
        '<td>' + escapeHtml(monitorRowCity(row)) + '</td>' +
        '<td>' + escapeHtml(monitorRowNeighborhood(row)) + '</td>' +
        '<td>' + escapeHtml(row.driver_id || 'Sem ID') + '</td>' +
        '<td>' + escapeHtml(row.driver_name || 'Sem driver') + '</td>' +
        '<td>' + escapeHtml(formatAgeingDays(row._ageing)) + '</td>' +
        '<td>' + escapeHtml(formatNumber(row._cogsNumber || 0)) + '</td>' +
        '<td>' + yesNoPill(row.avaria || 'Não') + '</td>' +
        '<td><textarea class="treatment-input monitor-row-treatment" rows="2" data-treatment-br="' + escapeAttr(row.shipment_id) + '">' + escapeHtml(row.tratativa || '') + '</textarea></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="11">Nenhuma BR encontrada com esses filtros.</td></tr>';
    els.monitorModalTable.innerHTML = head + '<tbody>' + body + '</tbody>';
    bindMonitorModalInlineEditors();
  }

  function bindMonitorModalInlineEditors() {
    if (!els.monitorModalTable) return;
    els.monitorModalTable.querySelectorAll('[data-treatment-br]').forEach(function (input) {
      input.addEventListener('input', debounce(function () {
        var row = findRowByShipment(input.dataset.treatmentBr, monitorModalAllRows);
        if (row) {
          row.tratativa = input.value;
          setTreatmentForShipment(row.shipment_id, input.value);
          persistTreatmentMapAndBase();
          updateTreatmentCounters();
        }
      }, 250));
    });
    els.monitorModalTable.querySelectorAll('[data-status-br]').forEach(function (select) {
      select.addEventListener('change', function () {
        var row = findRowByShipment(select.dataset.statusBr, monitorModalAllRows);
        if (row) {
          row.tracking_status = cleanCell(select.value);
          enrichRow(row);
          persistCurrentBaseSilent();
          populateFilters();
          renderKpis();
        }
      });
    });
  }

  function findRowByShipment(shipment, rows) {
    var br = normalizeTrace(shipment);
    return (rows || state.rows).find(function (row) { return normalizeTrace(row.shipment_id) === br; });
  }

  async function saveMonitorModalTreatments() {
    if (!els.monitorModalTable) return;
    var treatmentInputs = Array.from(els.monitorModalTable.querySelectorAll('[data-treatment-br]'));
    var statusInputs = Array.from(els.monitorModalTable.querySelectorAll('[data-status-br]'));
    treatmentInputs.forEach(function (input) {
      var row = findRowByShipment(input.dataset.treatmentBr, monitorModalAllRows);
      if (row) row.tratativa = input.value;
    });
    monitorModalAllRows.forEach(function (row) { setTreatmentForShipment(row.shipment_id, row.tratativa); });
    statusInputs.forEach(function (select) {
      var row = findRowByShipment(select.dataset.statusBr);
      if (row) { row.tracking_status = cleanCell(select.value); enrichRow(row); }
    });
    persistTreatmentMapAndBase();
    applyTreatmentMapToRows();
    populateFilters();
    applyAndRender();
    populateMonitorModalFilters();
    renderMonitorModalTable();
    await flushTreatmentSheetQueue({ forceAll: true, promptIfMissing: true, downloadIfNoHandle: true });
    setStatus('Alterações salvas para ' + monitorModalAllRows.length + ' BR(s) e enviadas para o Estoque de tratativas.', 'ok');
  }

  function copyMonitorModalBRs() {
    var text = monitorModalRows.map(function (row) { return row.shipment_id; }).filter(Boolean).join('\n');
    if (!text) return setStatus('Não há BRs abertas para copiar.', 'warn');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { setStatus('BRs copiadas.', 'ok'); });
    else { console.log(text); setStatus('BRs listadas no console porque o navegador bloqueou a cópia automática.', 'warn'); }
  }

  function exportMonitorModalRows() {
    if (!monitorModalRows.length) return setStatus('Não há BRs abertas para exportar.', 'warn');
    exportRows(monitorModalRows, 'monitoramento_' + monitorDef().label.replace(/\s+/g, '_').toLowerCase() + '.xlsx');
  }

  function renderTables() {
    renderTable(els.statusTable, ['tracking_status', 'Qtd', '%', 'Ageing 4+', 'Avaria'], groupRowsForTable('tracking_status').slice(0, 8).map(function (row) { return [row[0], row[1], row[2], row[3], row[5]]; }));
    renderTable(els.statusFullTable, ['tracking_status', 'Qtd', '%', 'Ageing 4+', 'Sem driver', 'Avaria', 'Com CEP', 'COGS'], groupRowsForTable('tracking_status'));
    renderTable(els.driversMiniTable, ['driver', 'Qtd', 'Ageing médio'], groupRowsForDriver().slice(0, 8));
    renderTable(els.driversTable, ['driver_id', 'driver_name', 'Qtd', '%', 'Ageing 4+', 'Avaria', 'Ageing médio', 'COGS'], groupDriversFull());
    renderTable(els.citiesTable, ['buyer_city', 'Qtd', '%', 'Ageing 4+', 'Sem driver', 'Avaria', 'Com CEP', 'COGS'], groupRowsForTable('buyer_city'));
    renderBaseTable();
  }

  function renderBaseTable() {
    var rows = state.filtered.slice();
    rows.sort(function (a, b) {
      if (state.sort.key === 'ageing_last_status') return sortValue(a._ageing, b._ageing, state.sort.dir);
      if (state.sort.key === 'cogs') return sortValue(a._cogsNumber, b._cogsNumber, state.sort.dir);
      return sortValue(a[state.sort.key] || '', b[state.sort.key] || '', state.sort.dir);
    });
    var htmlRows = rows.map(function (row) {
      var rowClass = row.prioridade === 'Crítica' ? 'row-critical' : row.prioridade === 'Alta' ? 'row-warning' : 'row-ok';
      return '<tr class="' + rowClass + '">' + BASE_COLUMNS.map(function (field) {
        var value = row[field] || '';
        if (field === 'ageing_last_status') return '<td>' + ageingPill(row._ageing, value) + '</td>';
        if (field === 'tracking_status') return '<td>' + statusPill(value) + '</td>';
        if (field === 'cogs') return '<td>' + escapeHtml(formatCogs(row)) + '</td>';
        if (field === 'avaria') return '<td>' + yesNoPill(value) + '</td>';
        if (field === 'prioridade') return '<td>' + priorityPill(value) + '</td>';
        if (field === 'cep' && !value) return '<td><span class="status-pill st-other">não importado</span></td>';
        return '<td>' + escapeHtml(value) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var headers = BASE_COLUMNS.map(function (field) {
      return '<th data-sort="' + field + '">' + label(field) + (state.sort.key === field ? (state.sort.dir === 'asc' ? ' ▲' : ' ▼') : '') + '</th>';
    }).join('');
    els.baseTable.innerHTML = '<thead><tr>' + headers + '</tr></thead><tbody>' + (htmlRows || '<tr><td colspan="' + BASE_COLUMNS.length + '">Nenhum dado para exibir.</td></tr>') + '</tbody>';
    els.baseTable.querySelectorAll('[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.dataset.sort;
        if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
        else state.sort = { key: key, dir: key === 'ageing_last_status' || key === 'cogs' ? 'desc' : 'asc' };
        renderBaseTable();
      });
    });
  }

  function groupRowsForTable(field) {
    var groups = topGroup(state.filtered, field);
    var total = state.filtered.length || 1;
    return groups.map(function (item) {
      var rows = item.rows;
      var critical = rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
      var noDriver = rows.filter(function (row) { return row._noDriver; }).length;
      var damaged = rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
      var withCep = rows.filter(function (row) { return row.cep; }).length;
      var cogs = rows.reduce(function (sum, row) { return sum + row._cogsNumber; }, 0);
      return [item.key, item.count, percentText(item.count, total), critical, noDriver, damaged, withCep, formatNumber(cogs)];
    });
  }

  function groupRowsForDriver() {
    return topGroup(state.filtered, 'driver_name', 'driver_id').map(function (item) { return [item.key, item.count, avgAgeing(item.rows)]; });
  }

  function groupDriversFull() {
    var map = new Map();
    state.filtered.forEach(function (row) {
      var key = (row.driver_id || 'Sem ID') + '||' + (row.driver_name || 'Não informado');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    var total = state.filtered.length || 1;
    return Array.from(map.entries()).map(function (entry) {
      var parts = entry[0].split('||');
      var rows = entry[1];
      var critical = rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
      var damaged = rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
      var cogs = rows.reduce(function (sum, row) { return sum + row._cogsNumber; }, 0);
      return [parts[0], parts[1], rows.length, percentText(rows.length, total), critical, damaged, avgAgeing(rows), formatNumber(cogs)];
    }).sort(function (a, b) { return b[2] - a[2]; });
  }

  function renderTable(table, headers, rows) {
    var head = '<thead><tr>' + headers.map(function (header) { return '<th>' + escapeHtml(header) + '</th>'; }).join('') + '</tr></thead>';
    var body = '<tbody>' + (rows && rows.length ? rows.map(function (row) {
      return '<tr>' + row.map(function (cell) { return '<td>' + escapeHtml(cell) + '</td>'; }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="' + headers.length + '">Nenhum dado para exibir.</td></tr>') + '</tbody>';
    table.innerHTML = head + body;
  }

  function renderCepReference() {
    if (!els.cepTable) return;
    var query = normalizeSearch(state.filters.cepSearch || '');
    var city = state.filters.cepCity || 'all';
    var rows = cepReference.filter(function (row) {
      if (city !== 'all' && (row.cidade || 'Não informado') !== city) return false;
      if (query) {
        var haystack = normalizeSearch([row.cep, row.cidade, row.bairro].join(' '));
        if (haystack.indexOf(query) < 0) return false;
      }
      return true;
    }).slice(0, 500);
    els.cepStatus.textContent = cepReference.length + ' CEPs fixos carregados. Exibindo ' + rows.length + ' registros na consulta.';
    renderTable(els.cepTable, ['CEP', 'Cidade', 'Bairro'], rows.map(function (row) { return [row.cep, row.cidade, row.bairro || '-']; }));
  }

  function populateCepCityFilter() {
    if (!els.cepCityFilter) return;
    var cities = Array.from(new Set(cepReference.map(function (row) { return row.cidade || 'Não informado'; }))).sort(localeSort);
    els.cepCityFilter.innerHTML = '<option value="all">Todas as cidades</option>' + cities.map(function (city) { return '<option value="' + escapeAttr(city) + '">' + escapeHtml(city) + '</option>'; }).join('');
  }

  function statusPill(value) {
    var cls = 'st-other';
    var text = normalizeHeader(value);
    if (text.indexOf('deliver') >= 0) cls = 'st-delivering';
    if (text.indexOf('received') >= 0) cls = 'st-received';
    if (text.indexOf('assigned') >= 0) cls = 'st-assigned';
    if (text.indexOf('hold') >= 0) cls = 'st-hold';
    if (text.indexOf('damage') >= 0 || text.indexOf('avaria') >= 0) cls = 'st-damage';
    return '<span class="status-pill ' + cls + '">' + escapeHtml(value || 'Não informado') + '</span>';
  }

  function ageingPill(ageing, original) {
    var cls = 'stuck-empty';
    if (ageing != null && ageing >= 4) cls = 'stuck-critical';
    else if (ageing != null && ageing >= 2) cls = 'stuck-warning';
    else if (ageing != null) cls = 'stuck-ok';
    return '<span class="stuck-pill ' + cls + '">' + escapeHtml(original || 'S/AGE') + '</span>';
  }

  function yesNoPill(value) { return '<span class="status-pill ' + (value === 'Sim' ? 'st-damage' : 'st-other') + '">' + escapeHtml(value || 'Não') + '</span>'; }
  function priorityPill(value) {
    var cls = value === 'Crítica' ? 'st-damage' : value === 'Alta' ? 'st-hold' : value === 'Média' ? 'st-received' : 'st-delivering';
    return '<span class="status-pill ' + cls + '">' + escapeHtml(value || '-') + '</span>';
  }

  function topGroup(rows, primary, secondary) {
    var map = new Map();
    rows.forEach(function (row) {
      var key = cleanCell(row[primary]) || (secondary ? cleanCell(row[secondary]) : '') || 'Não informado';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries()).map(function (entry) { return { key: entry[0], count: entry[1].length, rows: entry[1] }; }).sort(function (a, b) { return b.count - a.count || localeSort(a.key, b.key); });
  }

  function groupForExport(primary, secondary) {
    return topGroup(state.filtered, primary, secondary).map(function (item) {
      return {
        grupo: item.key,
        quantidade: item.count,
        percentual: percentText(item.count, state.filtered.length),
        ageing_4_mais: item.rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length,
        sem_driver: item.rows.filter(function (row) { return row._noDriver; }).length,
        avarias: item.rows.filter(function (row) { return row.avaria === 'Sim'; }).length,
        com_cep: item.rows.filter(function (row) { return row.cep; }).length,
        cogs: formatCurrency(item.rows.reduce(function (sum, row) { return sum + row._cogsNumber; }, 0))
      };
    });
  }

  function avgAgeing(rows) {
    var values = rows.map(function (row) { return row._ageing; }).filter(function (value) { return value != null && Number.isFinite(value); });
    if (!values.length) return '-';
    return (values.reduce(function (sum, value) { return sum + value; }, 0) / values.length).toFixed(1);
  }

  function quickFilter(type) {
    if (type === 'all') return resetFilters();
    if (type && type.indexOf('statusKey:') === 0) {
      var statusKey = type.split(':')[1];
      var statusValue = firstStatusForKpiKey(statusKey);
      state.filters.status = statusValue || 'all';
      populateFilters();
      if (els.statusFilter) els.statusFilter.value = statusValue || 'all';
      applyAndRender();
      return;
    }
    if (type === 'critical') { state.filters.ageing = '4+'; els.ageingFilter.value = '4+'; }
    if (type === 'noDriver') { state.filters.driver = 'Não informado'; populateFilters(); els.driverFilter.value = 'Não informado'; }
    if (type === 'damage') { state.filters.avaria = 'Sim'; els.avariaFilter.value = 'Sim'; }
    if (type === 'withCep') { state.filters.cep = 'withCep'; els.cepFilter.value = 'withCep'; }
    if (type === 'withNeighborhood') { state.filters.cep = 'withNeighborhood'; els.cepFilter.value = 'withNeighborhood'; }
    if (type === 'withoutCep') { state.filters.cep = 'withoutCep'; els.cepFilter.value = 'withoutCep'; }
    if (type === 'highCogs') { state.sort = { key: 'cogs', dir: 'desc' }; setView('base'); }
    applyAndRender();
  }

  function resetFilters(render) {
    state.filters.status = 'all'; state.filters.city = 'all'; state.filters.driver = 'all'; state.filters.ageing = 'all'; state.filters.priority = 'all'; state.filters.avaria = 'all'; state.filters.cep = 'all'; state.filters.search = '';
    if (els.statusFilter) els.statusFilter.value = 'all';
    if (els.cityFilter) els.cityFilter.value = 'all';
    if (els.driverFilter) els.driverFilter.value = 'all';
    if (els.ageingFilter) els.ageingFilter.value = 'all';
    if (els.priorityFilter) els.priorityFilter.value = 'all';
    if (els.avariaFilter) els.avariaFilter.value = 'all';
    if (els.cepFilter) els.cepFilter.value = 'all';
    if (els.searchInput) els.searchInput.value = '';
    if (render !== false) applyAndRender();
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll('.view').forEach(function (section) { section.classList.toggle('active', section.id === view); });
    document.querySelectorAll('.nav-button[data-view]').forEach(function (button) {
      var isMonitorButton = !!button.dataset.monitorStatus;
      var active = isMonitorButton ? (view === 'monitoring' && button.dataset.monitorStatus === state.monitor.type) : (button.dataset.view === view);
      button.classList.toggle('active', active);
    });
    if (els.monitorToggle) els.monitorToggle.classList.toggle('active', view === 'monitoring');
    var titles = {
      dashboard: '🏠 Dashboard Stucks',
      monitoring: monitorDef().title,
      base: '📦 Base de Stucks',
      damages: '⚠️ Avarias',
      treatments: '📝 Tratativas',
      cities: '📍 Cidades',
      drivers: '🚚 Drivers',
      status: '📊 Status',
      ceps: '🗺️ CEPs',
      history: '🕓 Histórico'
    };
    els.viewTitle.textContent = titles[view] || 'Dashboard Stucks';
    if (els.filterBar) {
      // O monitoramento (Received, Assigned, SOC LH e OnHold) já possui filtros próprios.
      // Por isso a barra global fica oculta somente nessas abas para evitar filtro duplicado.
      els.filterBar.classList.toggle('hidden', !state.rows.length || view === 'monitoring');
    }
  }

  function persistCurrentBaseSilent() {
    if (!state.rows.length) return;
    try {
      var payload = { rows: state.rows, fileName: state.fileName, importedAt: state.importedAt || new Date().toISOString() };
      safeSetStorage(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Não foi possível salvar backup local da base.', error);
    }
  }

  function restoreLocalBackupOnStart() {
    var raw = safeGetStorage(STORAGE_KEY, '');
    if (!raw) return false;
    try {
      var payload = JSON.parse(raw);
      if (!payload || !Array.isArray(payload.rows) || !payload.rows.length) return false;
      state.rows = payload.rows.map(function (row) {
        if (row._importAvaria == null) row._importAvaria = normalizeYesNo(row.avaria);
        if (row._importTratativa == null) row._importTratativa = cleanCell(row.tratativa || '');
        enrichRow(row);
        return row;
      });
      applyDamageListToRows();
      applyTreatmentMapToRows();
      state.fileName = payload.fileName || 'Backup local';
      state.importedAt = payload.importedAt || new Date().toISOString();
      populateFilters();
      resetFilters(false);
      applyAndRender();
      setStatus('Backup local restaurado automaticamente. Tratativas salvas continuam disponíveis pela BR.', 'ok');
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveLocal() {
    if (!state.rows.length) return setStatus('Não há base carregada para salvar.', 'warn');
    var payload = { rows: state.rows, fileName: state.fileName, importedAt: state.importedAt };
    safeSetStorage(STORAGE_KEY, JSON.stringify(payload));
    setStatus('Base salva neste navegador junto com as tratativas já aplicadas.', 'ok');
  }

  function loadLocal() {
    var raw = safeGetStorage(STORAGE_KEY, '');
    if (!raw) return setStatus('Nenhuma base salva foi encontrada neste navegador.', 'warn');
    try {
      var payload = JSON.parse(raw);
      state.rows = (payload.rows || []).map(function (row) { if (row._importAvaria == null) row._importAvaria = normalizeYesNo(row.avaria); if (row._importTratativa == null) row._importTratativa = cleanCell(row.tratativa || ''); enrichRow(row); return row; });
      applyDamageListToRows();
      applyTreatmentMapToRows();
      state.fileName = payload.fileName || 'Base salva';
      state.importedAt = payload.importedAt || new Date().toISOString();
      populateFilters(); resetFilters(false); applyAndRender();
      setStatus('Base salva carregada com sucesso.', 'ok');
    } catch (error) { setStatus('Não foi possível carregar a base salva.', 'error'); }
  }

  function clearCurrent() {
    if (!state.rows.length) return setStatus('A base atual já está vazia.', 'warn');
    state.rows = []; state.filtered = []; state.fileName = ''; state.importedAt = null;
    safeRemoveStorage(STORAGE_KEY);
    resetFilters(false); updateDamageSidebar(); renderEmpty();
    setStatus('Base atual limpa. Importe uma nova planilha de stucks.', 'warn');
  }

  function addHistory(fileName, rows) {
    var history = getHistory();
    var critical = rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
    history.unshift({
      data: new Date().toISOString(), arquivo: fileName, total: rows.length,
      ageing_4_mais: critical,
      sem_driver: rows.filter(function (row) { return row._noDriver; }).length,
      avarias: rows.filter(function (row) { return row.avaria === 'Sim'; }).length,
      com_cep: rows.filter(function (row) { return row.cep; }).length,
      cidade_foco: (topGroup(rows, 'buyer_city')[0] || {}).key || '-',
      status_foco: (topGroup(rows, 'tracking_status')[0] || {}).key || '-'
    });
    safeSetStorage(HISTORY_KEY, JSON.stringify(history.slice(0, 60)));
  }

  function getHistory() { try { return JSON.parse(safeGetStorage(HISTORY_KEY, '[]') || '[]'); } catch (error) { return []; } }
  function renderHistory() {
    var history = getHistory();
    els.historyBadge.textContent = String(history.length);
    els.historyBadge.classList.toggle('hidden', !history.length);
    renderTable(els.historyTable, ['Data', 'Arquivo', 'Total', 'Ageing 4+', 'Sem driver', 'Avarias', 'Com CEP', 'Cidade foco', 'Status foco'], history.map(function (item) {
      return [formatDateTime(item.data), item.arquivo, item.total, item.ageing_4_mais, item.sem_driver, item.avarias || 0, item.com_cep || 0, item.cidade_foco, item.status_foco];
    }));
  }
  function clearHistory() { safeRemoveStorage(HISTORY_KEY); renderHistory(); setStatus('Histórico de importações limpo.', 'warn'); }

  function copySummary() {
    var rows = state.filtered;
    if (!rows.length) return setStatus('Não há dados na visão atual para copiar.', 'warn');
    var critical = rows.filter(function (row) { return row._ageing != null && row._ageing >= 4; }).length;
    var noDriver = rows.filter(function (row) { return row._noDriver; }).length;
    var damaged = rows.filter(function (row) { return row.avaria === 'Sim'; }).length;
    var withCep = rows.filter(function (row) { return row.cep; }).length;
    var topCity = topGroup(rows, 'buyer_city')[0];
    var topStatus = topGroup(rows, 'tracking_status')[0];
    var text = [
      'RESUMO STUCKS',
      'Total na visão: ' + rows.length,
      'Ageing 4+: ' + critical + ' (' + percentText(critical, rows.length) + ')',
      'Sem driver: ' + noDriver + ' (' + percentText(noDriver, rows.length) + ')',
      'Avarias: ' + damaged + ' (' + percentText(damaged, rows.length) + ')',
      'Com CEP: ' + withCep + ' (' + percentText(withCep, rows.length) + ')',
      'Cidade foco: ' + (topCity ? topCity.key + ' - ' + topCity.count : '-'),
      'Status foco: ' + (topStatus ? topStatus.key + ' - ' + topStatus.count : '-'),
      'Arquivo: ' + (state.fileName || '-'),
      'Atualizado em: ' + formatDateTime(state.importedAt)
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { setStatus('Resumo copiado para a área de transferência.', 'ok'); });
    else { console.log(text); setStatus('Resumo pronto, mas o navegador bloqueou a cópia automática.', 'warn'); }
  }

  function exportRows(rows, fileName) {
    if (!rows || !rows.length) return setStatus('Não há dados para exportar.', 'warn');
    var normalized = normalizeRowsForExport(rows);
    var safeName = String(fileName || 'exportacao.xlsx').replace(/\.csv$/i, '.xlsx');

    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      var ws = XLSX.utils.json_to_sheet(normalized);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'EXPORTACAO');
      XLSX.writeFile(wb, safeName);
      setStatus('Arquivo exportado: ' + safeName + '. Dias parados exportado com o valor exato e COGS em R$.', 'ok');
      return;
    }

    var csv = toCsv(normalized);
    var fallbackName = safeName.replace(/\.xlsx$/i, '.csv');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fallbackName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatus('Arquivo exportado: ' + fallbackName + '. Dias parados exportado com o valor exato e COGS em R$.', 'ok');
  }

  function normalizeRowsForExport(rows) {
    var hasBaseShape = rows.some(function (row) { return row && !Array.isArray(row) && row.shipment_id != null; });
    return rows.map(function (row) {
      if (Array.isArray(row)) return row;
      var out = {};

      if (hasBaseShape) {
        EXPORT_BASE_COLUMNS.forEach(function (key) {
          if (key === 'ageing_last_status') out[key] = exactAgeingForExport(row);
          else if (key === 'cogs') out[key] = formatCogs(row);
          else if (row[key] != null) out[key] = row[key];
          else out[key] = '';
        });
        Object.keys(row).forEach(function (key) {
          if (key[0] === '_' || key === 'faixa_ageing' || out[key] != null) return;
          out[key] = key === 'cogs' ? formatCogs(row) : row[key];
        });
        delete out.faixa_ageing;
        return out;
      }

      Object.keys(row).forEach(function (key) {
        if (key[0] === '_' || key === 'faixa_ageing') return;
        out[key] = key === 'cogs' ? formatCurrency(parseNumber(row[key])) : row[key];
      });
      return out;
    });
  }

  function exactAgeingForExport(row) {
    var ageing = row && row._ageing != null ? row._ageing : parseAgeing(row ? row.ageing_last_status : '');
    if (ageing == null || !Number.isFinite(ageing)) return cleanCell(row ? row.ageing_last_status : '');
    return Number.isInteger(ageing) ? ageing : Number(ageing.toFixed(2));
  }

  function toCsv(rows) {
    if (!rows.length) return '';
    var headers = Array.isArray(rows[0]) ? rows[0].map(function (_, i) { return 'coluna_' + (i + 1); }) : Object.keys(rows[0]);
    var lines = [headers.join(';')];
    rows.forEach(function (row) {
      var values = Array.isArray(row) ? row : headers.map(function (header) { return row[header]; });
      lines.push(values.map(csvEscape).join(';'));
    });
    return lines.join('\n');
  }

  function csvEscape(value) { var text = value == null ? '' : String(value); return /[";\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; }
  function label(field) { return FIELD_LABELS[field] || field; }
  function setStatus(message, type) { els.appStatus.textContent = message; els.appStatus.className = 'cloud-status' + (type ? ' ' + type : ''); }
  function percentText(value, total) { return total ? Math.round((value / total) * 100) + '%' : '0%'; }
  function formatNumber(value) { return formatCurrency(value); }
  function formatCurrency(value) { var number = Number(value); if (!Number.isFinite(number)) number = 0; return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function formatCogs(row) { var number = row && Number.isFinite(row._cogsNumber) ? row._cogsNumber : parseNumber(row ? row.cogs : ''); return formatCurrency(number); }
  function formatDateTime(iso) { if (!iso) return '-'; try { return new Date(iso).toLocaleString('pt-BR'); } catch (error) { return '-'; } }
  function localeSort(a, b) { return String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' }); }
  function sortValue(a, b, dir) { var result; if (typeof a === 'number' || typeof b === 'number') result = (a == null ? -Infinity : a) - (b == null ? -Infinity : b); else result = localeSort(a, b); return dir === 'asc' ? result : -result; }
  function normalizeHeader(value) { return cleanCell(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim(); }
  function normalizeSearch(value) { return cleanCell(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function cleanCell(value) { if (value == null) return ''; if (value instanceof Date) return value.toISOString().slice(0, 10); var text = String(value).replace(/\s+/g, ' ').trim(); return /^(null|undefined|nan)$/i.test(text) ? '' : text; }
  function normalizeTrace(value) { return cleanCell(value).replace(/\s+/g, '').toUpperCase(); }
  function onlyDigits(value) { return String(value == null ? '' : value).replace(/\D+/g, ''); }
  function normalizeCep(value) { var digits = onlyDigits(value); if (!digits) return ''; return digits.padStart(8, '0').slice(-8); }
  function normalizeYesNo(value) { var text = normalizeHeader(value); if (!text) return 'Não'; return /^(sim|s|yes|y|true|1)$/i.test(text) || text.indexOf('avaria') >= 0 || text.indexOf('damage') >= 0 || text.indexOf('danificado') >= 0 ? 'Sim' : 'Não'; }
  function parseAgeing(value) { var text = cleanCell(value).replace(',', '.'); var match = text.match(/-?\d+(\.\d+)?/); return match ? Number(match[0]) : null; }
  function parseNumber(value) { var text = cleanCell(value); if (!text) return 0; text = text.replace(/R\$/gi, '').replace(/\s/g, ''); if (text.indexOf(',') >= 0 && text.indexOf('.') >= 0) text = text.replace(/\./g, '').replace(',', '.'); else text = text.replace(',', '.'); var number = Number(text.replace(/[^0-9.-]/g, '')); return Number.isFinite(number) ? number : 0; }
  function priorityFor(ageing, avaria, noDriver) { var days = ageing == null ? 0 : ageing; if ((avaria === 'Sim' && days >= 7) || days >= 10) return 'Crítica'; if (days >= 7 || noDriver) return 'Alta'; if (days >= 5) return 'Média'; return 'Baixa'; }
  function ageingRange(ageing) { if (ageing == null) return 'Sem ageing'; if (ageing <= 1) return '0-1'; if (ageing <= 3) return '2-3'; if (ageing <= 6) return '4-6'; if (ageing <= 9) return '7-9'; return '10+'; }
  function cepFilterLabel(value) { return { withCep: 'Com CEP', withNeighborhood: 'Com bairro', withoutCep: 'Sem CEP' }[value] || value; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#096;'); }
  function debounce(fn, wait) { var timer; return function () { clearTimeout(timer); var args = arguments; timer = setTimeout(function () { fn.apply(null, args); }, wait); }; }



  function verifyImportControls() {
    var missing = [];
    if (!els.fileInput) missing.push('fileInput');
    if (!els.cepInput) missing.push('cepInput');
    if (!els.importStucksBtn) missing.push('importStucksBtn');
    if (!els.importCepBtn) missing.push('importCepBtn');
    if (missing.length) {
      setStatus('Erro crítico: controles de importação não encontrados: ' + missing.join(', ') + '. Atualize os arquivos index.html e app.js no GitHub.', 'error');
      return false;
    }
    return true;
  }

  function hardenGitHubPagesLayout() {
    // Fallback de interface para GitHub Pages: o dashboard não pode depender só de ícone externo.
    var iconFallbacks = {
      saveBtn: '💾',
      loadBtn: '🗄️',
      clearBtn: '🗑️',
      copySummaryBtn: '📋',
      exportBtn: '⬇️'
    };

    Object.keys(iconFallbacks).forEach(function (id) {
      var button = document.getElementById(id);
      if (!button) return;
      var visibleText = (button.textContent || '').trim();
      if (!visibleText || visibleText.length > 4) {
        button.innerHTML = '<span aria-hidden="true">' + iconFallbacks[id] + '</span>';
      }
      button.classList.add('stable-action');
    });

    document.querySelectorAll('.nav-button').forEach(function (button) {
      if (!button.querySelector('span')) return;
      var label = button.querySelector('span').textContent.trim();
      if (!label) button.style.display = 'none';
    });

    document.querySelectorAll('.top-actions .import-button').forEach(function (button) {
      button.classList.add('stable-import-action');
    });

    if (els && els.appStatus && !state.rows.length) {
      els.appStatus.textContent = 'Aguardando importação da STUCKS. As tratativas ficam na nuvem, mas a base do dia precisa ser importada neste PC para cruzar pela BR.';
      els.appStatus.className = 'cloud-status warn';
    }
  }

  // =========================================================
  // SUPABASE COMO ESTOQUE CENTRAL DE TRATATIVAS
  // Estas funções substituem o fluxo antigo de Excel local.
  // =========================================================

  function cleanSupabaseUrl(value) {
    var url = cleanCell(value || '').replace(/\/+$/, '');
    return url;
  }

  function isSupabaseConfigured() {
    return !!(supabaseConfig.url && supabaseConfig.anonKey && /^https:\/\/[^\s]+\.supabase\.co$/i.test(supabaseConfig.url));
  }

  function supabaseHeaders(extra) {
    var headers = {
      apikey: supabaseConfig.anonKey,
      Authorization: 'Bearer ' + supabaseConfig.anonKey,
      'Content-Type': 'application/json'
    };
    Object.keys(extra || {}).forEach(function (key) { headers[key] = extra[key]; });
    return headers;
  }

  function supabaseEndpoint(path) {
    return supabaseConfig.url + '/rest/v1/' + path;
  }

  async function supabaseRequest(path, options) {
    if (!isSupabaseConfigured()) throw new Error('Supabase não configurado.');
    options = options || {};
    options.headers = supabaseHeaders(options.headers || {});
    var response = await fetch(supabaseEndpoint(path), options);
    var text = await response.text();
    if (!response.ok) {
      throw new Error('Supabase retornou ' + response.status + ': ' + (text || response.statusText));
    }
    if (!text) return null;
    try { return JSON.parse(text); } catch (error) { return text; }
  }

  function loadSupabasePendingQueue() {
    treatmentSheetSync.pending.clear();
    try {
      var raw = safeGetStorage(SUPABASE_PENDING_KEY, '{}');
      var data = JSON.parse(raw || '{}');
      Object.keys(data || {}).forEach(function (br) {
        var value = data[br];
        if (value && value.shipment_id) treatmentSheetSync.pending.set(br, value);
      });
    } catch (error) {
      treatmentSheetSync.pending.clear();
    }
  }

  function persistSupabasePendingQueue() {
    var data = {};
    treatmentSheetSync.pending.forEach(function (record, br) { data[br] = record; });
    safeSetStorage(SUPABASE_PENDING_KEY, JSON.stringify(data));
  }

  function loadTreatmentSheetConfig() {
    supabaseConfig.url = cleanSupabaseUrl(safeGetStorage(SUPABASE_URL_KEY, ''));
    supabaseConfig.anonKey = safeGetStorage(SUPABASE_ANON_KEY, '');
    loadSupabasePendingQueue();
    if (els.treatmentSheetUrlInput) els.treatmentSheetUrlInput.value = supabaseConfig.url || '';
    if (els.treatmentSupabaseKeyInput) els.treatmentSupabaseKeyInput.value = supabaseConfig.anonKey || '';
    if (isSupabaseConfigured()) {
      updateTreatmentSheetStatus('Supabase configurado. As tratativas serão salvas na nuvem e reaplicadas pela BR.', 'ok');
    } else {
      updateTreatmentSheetStatus('Configure a URL e a anon key do Supabase. Enquanto isso, as tratativas ficam salvas apenas neste navegador.', 'warn');
    }
  }

  async function saveTreatmentSheetConfig() {
    supabaseConfig.url = cleanSupabaseUrl(els.treatmentSheetUrlInput && els.treatmentSheetUrlInput.value);
    supabaseConfig.anonKey = cleanCell(els.treatmentSupabaseKeyInput && els.treatmentSupabaseKeyInput.value);
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      updateTreatmentSheetStatus('Preencha SUPABASE_URL e SUPABASE_ANON_KEY antes de salvar a conexão.', 'error');
      return;
    }
    safeSetStorage(SUPABASE_URL_KEY, supabaseConfig.url);
    safeSetStorage(SUPABASE_ANON_KEY, supabaseConfig.anonKey);
    updateTreatmentSheetStatus('Conexão salva. Testando Supabase...', 'warn');
    try {
      await refreshTreatmentsFromSheet({ silent: true });
      await flushTreatmentSheetQueue({ forceAll: true, silent: true });
      updateTreatmentSheetStatus('✅ Supabase conectado. Tratativas sincronizadas e disponíveis em outros PCs.', 'ok');
      setStatus('Supabase conectado como estoque central das tratativas.', 'ok');
    } catch (error) {
      updateTreatmentSheetStatus('Não consegui conectar ao Supabase. Confira URL, anon key, tabela e políticas RLS. Erro: ' + (error.message || error), 'error');
    }
  }

  function queueTreatmentSheetSync(br, text) {
    br = normalizeTrace(br);
    if (!br) return;
    var record = buildTreatmentRecord(br, text);
    if (!record.tratativa) record._delete = true;
    treatmentSheetSync.pending.set(br, record);
    persistSupabasePendingQueue();
    if (isSupabaseConfigured()) updateTreatmentSheetStatus('Tratativa salva localmente. Sincronizando com Supabase...', 'warn');
    else updateTreatmentSheetStatus('Tratativa salva localmente. Configure o Supabase para compartilhar entre PCs.', 'warn');
    clearTimeout(treatmentSheetSync.timer);
    treatmentSheetSync.timer = setTimeout(function () { flushTreatmentSheetQueue({ silent: true }); }, 700);
  }

  function normalizeSupabaseRecord(record) {
    record = record || {};
    var row = {
      shipment_id: normalizeTrace(record.shipment_id),
      tratativa: cleanCell(record.tratativa),
      tracking_status: cleanCell(record.tracking_status),
      cidade: cleanCell(record.cidade),
      bairro: cleanCell(record.bairro),
      driver: cleanCell(record.driver),
      ageing_last_status: cleanCell(record.ageing_last_status),
      avaria: cleanCell(record.avaria),
      updated_at: new Date().toISOString()
    };
    return row;
  }

  async function upsertSupabaseTreatments(records) {
    var rows = (records || []).filter(function (record) {
      return record && record.shipment_id && record.tratativa && !record._delete;
    }).map(normalizeSupabaseRecord);
    if (!rows.length) return 0;
    await supabaseRequest(supabaseConfig.table + '?on_conflict=shipment_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
    return rows.length;
  }

  async function deleteSupabaseTreatments(records) {
    var rows = (records || []).filter(function (record) { return record && record.shipment_id && (!record.tratativa || record._delete); });
    var count = 0;
    for (var i = 0; i < rows.length; i++) {
      await supabaseRequest(supabaseConfig.table + '?shipment_id=eq.' + encodeURIComponent(normalizeTrace(rows[i].shipment_id)), { method: 'DELETE' });
      count++;
    }
    return count;
  }

  async function flushTreatmentSheetQueue(options) {
    options = options || {};
    persistTreatmentMap();
    persistCurrentBaseSilent();
    var records = options.forceAll ? treatmentRowsForWorkbook() : Array.from(treatmentSheetSync.pending.values());
    if (!records.length && !options.forceAll) {
      if (!options.silent) updateTreatmentSheetStatus('Nada novo para sincronizar.', 'ok');
      return;
    }
    if (!isSupabaseConfigured()) {
      persistSupabasePendingQueue();
      if (!options.silent) updateTreatmentSheetStatus('Supabase ainda não configurado. Tratativas continuam salvas localmente neste navegador.', 'warn');
      return;
    }
    if (treatmentSheetSync.busy) return;
    treatmentSheetSync.busy = true;
    try {
      var saved = await upsertSupabaseTreatments(records);
      var deleted = await deleteSupabaseTreatments(records);
      records.forEach(function (record) { if (record && record.shipment_id) treatmentSheetSync.pending.delete(normalizeTrace(record.shipment_id)); });
      persistSupabasePendingQueue();
      treatmentSheetSync.lastSavedAt = new Date().toISOString();
      updateTreatmentSheetStatus('✅ Supabase sincronizado: ' + saved + ' salva(s)' + (deleted ? ', ' + deleted + ' removida(s)' : '') + '. Estoque central disponível em outros PCs.', 'ok');
    } catch (error) {
      records.forEach(function (record) { if (record && record.shipment_id) treatmentSheetSync.pending.set(normalizeTrace(record.shipment_id), record); });
      persistSupabasePendingQueue();
      updateTreatmentSheetStatus('Tratativa salva localmente, mas ainda não foi para o Supabase. Ela ficou na fila e tentará novamente. Erro: ' + (error.message || error), 'error');
    } finally {
      treatmentSheetSync.busy = false;
    }
  }

  async function refreshTreatmentsFromSheet(options) {
    options = options || {};
    if (!isSupabaseConfigured()) {
      if (!options.silent) updateTreatmentSheetStatus('Supabase não configurado. As tratativas atuais estão apenas neste navegador.', 'warn');
      return 0;
    }
    try {
      if (!options.silent) updateTreatmentSheetStatus('Importando tratativas da nuvem...', 'warn');
      var rows = await supabaseRequest(supabaseConfig.table + '?select=shipment_id,tratativa,tracking_status,cidade,bairro,driver,ageing_last_status,avaria,updated_at&order=updated_at.desc&limit=10000', {
        method: 'GET'
      });
      var imported = 0;
      (rows || []).forEach(function (row) {
        var br = normalizeTrace(row.shipment_id);
        var treatment = cleanCell(row.tratativa);
        if (!br || !treatment) return;
        treatmentMap.set(br, treatment);
        imported++;
      });
      applyTreatmentMapToRows();
      persistTreatmentMapAndBase();
      applyAndRender();
      treatmentSheetSync.lastLoadedAt = new Date().toISOString();

      if (state.rows.length) {
        updateTreatmentSheetStatus('✅ Tratativas importadas da nuvem: ' + imported + ' BR(s). Elas foram cruzadas com a base STUCKS atual pela BR.', 'ok');
        setStatus('Tratativas importadas da nuvem e aplicadas na base atual.', 'ok');
      } else {
        updateTreatmentSheetStatus('✅ Tratativas importadas da nuvem: ' + imported + ' BR(s). Importe a base STUCKS do dia para o dashboard cruzar pela BR.', 'ok');
        if (!options.silent) setStatus('Tratativas importadas da nuvem. O dashboard fica vazio até você importar a base STUCKS do dia.', 'warn');
      }

      if (treatmentSheetSync.pending.size) flushTreatmentSheetQueue({ silent: true });
      return imported;
    } catch (error) {
      if (!options.silent) updateTreatmentSheetStatus('Não consegui importar tratativas do Supabase. Usando estoque local deste navegador. Erro: ' + (error.message || error), 'error');
      return 0;
    }
  }

  async function clearTreatmentsFromSheet() {
    treatmentSheetSync.pending.clear();
    persistSupabasePendingQueue();
    // Não apaga a nuvem automaticamente para evitar perda acidental em massa.
    // Para apagar uma BR da nuvem, limpe a tratativa dela e salve.
  }

  function exportTreatmentsWorkbook() {
    var rows = treatmentRowsForTable().map(function (row) {
      return {
        shipment_id: row.shipment_id,
        tratativa: row.tratativa,
        tracking_status: row.tracking_status || '',
        cidade: row.cidade || '',
        bairro: row.bairro || '',
        driver: row.driver || '',
        ageing_last_status: row.ageing_last_status || '',
        avaria: row.avaria || '',
        updated_at: new Date().toISOString()
      };
    });
    if (!rows.length) rows = [{ shipment_id: '', tratativa: '', tracking_status: '', cidade: '', bairro: '', driver: '', ageing_last_status: '', avaria: '', updated_at: '' }];
    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'TRATATIVAS_BACKUP');
      XLSX.writeFile(wb, 'backup_tratativas_stucks.xlsx');
      updateTreatmentSheetStatus('Backup Excel baixado. O estoque central continua sendo o Supabase.', 'ok');
    } else {
      exportRows(rows, 'backup_tratativas_stucks.xlsx');
    }
  }

  window.STUCKS_APP = {
    version: 'cliques-importacao-fix-final-20260711',
    importStucksFile: importStucksFile,
    importCepFile: importCepFile,
    refreshTreatmentsFromSheet: refreshTreatmentsFromSheet,
    flushTreatmentSheetQueue: flushTreatmentSheetQueue,
    setView: setView,
    setStatus: setStatus
  };

}());
