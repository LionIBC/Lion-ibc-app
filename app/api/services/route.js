import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapService(row) {
  if (!row) return null;

  return {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    description: row.description || '',
    category: row.category || '',
    default_unit: row.default_unit || 'Stück',
    default_price: toNumber(row.default_price, 0),
    default_tax_rate: toNumber(row.default_tax_rate, 21),
    default_discount_percent: toNumber(row.default_discount_percent, 0),
    revenue_account: row.revenue_account || '',
    is_active: row.is_active !== false,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active_only');

    let query = supabase
      .from('service_catalog')
      .select('*')
      .order('name', { ascending: true });

    if (activeOnly === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: (data || []).map(mapService)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Leistungen konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = {
      code: String(body.code || '').trim() || null,
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim() || null,
      category: String(body.category || '').trim() || null,
      default_unit: String(body.default_unit || 'Stück').trim() || 'Stück',
      default_price: toNumber(body.default_price, 0),
      default_tax_rate: toNumber(body.default_tax_rate, 21),
      default_discount_percent: toNumber(body.default_discount_percent, 0),
      revenue_account: String(body.revenue_account || '').trim() || null,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString()
    };

    if (!payload.name) {
      return Response.json(
        {
          success: false,
          message: 'Name der Dienstleistung fehlt.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('service_catalog')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: mapService(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Dienstleistung konnte nicht erstellt werden.'
      },
      { status: 500 }
    );
  }
}

